import { randomUUID } from "crypto";
import { normalizeVendorPhone } from "@/lib/vendor-options";

/**
 * عميل Odoo مستقل (JSON-RPC) — يستبدل lib/erpnext.ts تدريجياً.
 * لا يُعاد استخدام أي شكل من ERPNext هنا؛ الواجهة مصممة لشكل بيانات Odoo نفسه.
 */

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

type OdooConfig = {
  baseUrl: string;
  database: string;
  username: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
};

function getConfig(): OdooConfig {
  const baseUrl = process.env.ODOO_BASE_URL?.replace(/\/$/, "");
  const database = process.env.ODOO_DATABASE;
  const username = process.env.ODOO_USERNAME;
  const apiKey = process.env.ODOO_API_KEY;

  if (!baseUrl || !database || !username || !apiKey) {
    throw new Error("Odoo is not configured (ODOO_BASE_URL/ODOO_DATABASE/ODOO_USERNAME/ODOO_API_KEY)");
  }

  const timeoutMs = Number(process.env.ODOO_REQUEST_TIMEOUT ?? 15000);
  const maxRetries = Number(process.env.ODOO_MAX_RETRIES ?? 2);

  return { baseUrl, database, username, apiKey, timeoutMs, maxRetries: Math.max(0, Math.min(maxRetries, 5)) };
}

// ─────────────────────────────────────────────────────────────
// Error normalization
// ─────────────────────────────────────────────────────────────

export type OdooErrorKind = "network" | "timeout" | "validation" | "auth" | "permission" | "conflict" | "unknown";

export class OdooClientError extends Error {
  kind: OdooErrorKind;
  retryable: boolean;
  correlationId: string;
  /** رسالة صالحة للعرض للمستخدم دون كشف تفاصيل داخلية */
  publicMessage: string;

  constructor(params: {
    message: string;
    kind: OdooErrorKind;
    retryable: boolean;
    correlationId: string;
    publicMessage?: string;
  }) {
    super(params.message);
    this.name = "OdooClientError";
    this.kind = params.kind;
    this.retryable = params.retryable;
    this.correlationId = params.correlationId;
    this.publicMessage = params.publicMessage ?? "تعذر إتمام العملية في نظام العمليات";
  }
}

function classifyError(raw: string, httpStatus: number | null): { kind: OdooErrorKind; retryable: boolean } {
  const lower = raw.toLowerCase();

  if (httpStatus !== null && httpStatus >= 500) return { kind: "network", retryable: true };
  if (httpStatus === 401 || httpStatus === 403) return { kind: "auth", retryable: false };

  if (lower.includes("accessdenied") || lower.includes("accesserror") || lower.includes("access denied")) {
    return { kind: "permission", retryable: false };
  }
  if (lower.includes("authenticationerror") || lower.includes("invalid credentials") || lower.includes("session expired")) {
    return { kind: "auth", retryable: false };
  }
  if (lower.includes("validationerror") || lower.includes("usererror") || lower.includes("valueerror")) {
    return { kind: "validation", retryable: false };
  }
  if (
    lower.includes("uniqueviolation") ||
    lower.includes("duplicate key") ||
    lower.includes("integrityerror") ||
    lower.includes("already exists")
  ) {
    return { kind: "conflict", retryable: false };
  }
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("abort") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  ) {
    return { kind: "network", retryable: true };
  }

  return { kind: "unknown", retryable: false };
}

// ─────────────────────────────────────────────────────────────
// JSON-RPC transport
// ─────────────────────────────────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: "2.0";
  method: "call";
  params: Record<string, unknown>;
  id: string;
};

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: { name?: string; message?: string; debug?: string };
  };
};

async function jsonRpcRaw<T>(
  service: string,
  method: string,
  args: unknown[],
  correlationId: string,
  timeoutMs: number
): Promise<T> {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "call",
    params: { service, method, args },
    id: correlationId,
  };

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isAbort = msg.toLowerCase().includes("abort");
    throw new OdooClientError({
      message: `Odoo request failed [${correlationId}]: ${isAbort ? "timeout" : msg}`,
      kind: isAbort ? "timeout" : "network",
      retryable: true,
      correlationId,
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  let json: JsonRpcResponse<T> | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new OdooClientError({
      message: `Odoo returned non-JSON response [${correlationId}]: HTTP ${res.status}`,
      kind: "network",
      retryable: res.status >= 500,
      correlationId,
    });
  }

  if (json?.error) {
    const detail = `${json.error.message} ${json.error.data?.name ?? ""} ${json.error.data?.message ?? ""}`;
    const { kind, retryable } = classifyError(detail, res.status);
    // السجل الكامل يبقى في سجلات السيرفر فقط — لا يُرسل للعميل
    console.error(`[Odoo][${correlationId}] ${service}.${method} failed:`, json.error.message, json.error.data?.name);
    throw new OdooClientError({
      message: `Odoo error [${correlationId}]: ${json.error.message}`,
      kind,
      retryable,
      correlationId,
    });
  }

  if (!res.ok) {
    const { kind, retryable } = classifyError(text, res.status);
    console.error(`[Odoo][${correlationId}] ${service}.${method} HTTP ${res.status}`);
    throw new OdooClientError({
      message: `Odoo HTTP error [${correlationId}]: ${res.status}`,
      kind,
      retryable,
      correlationId,
    });
  }

  return json?.result as T;
}

async function jsonRpcWithRetry<T>(service: string, method: string, args: unknown[]): Promise<T> {
  const config = getConfig();
  const correlationId = randomUUID();
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= config.maxRetries) {
    try {
      return await jsonRpcRaw<T>(service, method, args, correlationId, config.timeoutMs);
    } catch (err) {
      lastError = err;
      const retryable = err instanceof OdooClientError && err.retryable;
      if (!retryable || attempt === config.maxRetries) break;
      const backoffMs = Math.min(300 * 2 ** attempt, 3000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt += 1;
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────────────────────────
// Authentication (cached uid per server instance)
// ─────────────────────────────────────────────────────────────

let cachedUid: number | null = null;

async function getUid(): Promise<number> {
  if (cachedUid !== null) return cachedUid;
  const config = getConfig();
  const uid = await jsonRpcWithRetry<number | false>("common", "login", [config.database, config.username, config.apiKey]);
  if (!uid) {
    throw new OdooClientError({
      message: "Odoo authentication failed: invalid username/api key",
      kind: "auth",
      retryable: false,
      correlationId: randomUUID(),
      publicMessage: "تعذر الاتصال بنظام العمليات",
    });
  }
  cachedUid = uid;
  return uid;
}

async function executeKw<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<T> {
  const config = getConfig();
  const uid = await getUid();
  return jsonRpcWithRetry<T>("object", "execute_kw", [config.database, uid, config.apiKey, model, method, args, kwargs]);
}

// ─────────────────────────────────────────────────────────────
// Generic CRUD (no unlink in this phase)
// ─────────────────────────────────────────────────────────────

export async function searchRead<T = Record<string, unknown>>(
  model: string,
  domain: unknown[] = [],
  fields: string[] = [],
  opts: { limit?: number; order?: string } = {}
): Promise<T[]> {
  return executeKw<T[]>(model, "search_read", [domain], { fields, ...opts });
}

export async function read<T = Record<string, unknown>>(model: string, ids: number[], fields: string[] = []): Promise<T[]> {
  if (ids.length === 0) return [];
  return executeKw<T[]>(model, "read", [ids], { fields });
}

export async function create(model: string, vals: Record<string, unknown>): Promise<number> {
  return executeKw<number>(model, "create", [vals]);
}

export async function write(model: string, ids: number[], vals: Record<string, unknown>): Promise<boolean> {
  return executeKw<boolean>(model, "write", [ids, vals]);
}

export async function callMethod<T = unknown>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  return executeKw<T>(model, method, args, kwargs);
}

export async function fieldsGet(model: string, fields?: string[]): Promise<Record<string, unknown>> {
  return executeKw<Record<string, unknown>>(model, "fields_get", fields ? [fields] : [], { attributes: ["string", "type"] });
}

export async function createAttachment(params: {
  name: string;
  base64Data: string;
  resModel: string;
  resId: number;
  mimeType?: string;
}): Promise<{ id: number }> {
  const id = await create("ir.attachment", {
    name: params.name,
    datas: params.base64Data,
    res_model: params.resModel,
    res_id: params.resId,
    mimetype: params.mimeType,
  });
  return { id };
}

export async function getAttachmentMetadata(id: number): Promise<{ id: number; name: string; mimetype: string; file_size: number } | null> {
  const rows = await read<{ id: number; name: string; mimetype: string; file_size: number }>(
    "ir.attachment",
    [id],
    ["name", "mimetype", "file_size"]
  );
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────────────────────────────

export function normalizeCR(cr: string): string {
  return cr.replace(/\D/g, "").trim();
}

export function normalizeVAT(vat: string): string {
  return vat.replace(/\D/g, "").trim();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeSaudiPhone(phone: string): string {
  return normalizeVendorPhone(phone);
}

// ─────────────────────────────────────────────────────────────
// Partner / Supplier Profile lookups
// ─────────────────────────────────────────────────────────────

export type OdooPartnerRef = { id: number; name: string };
export type OdooSupplierProfileRef = {
  id: number;
  partnerId: number;
  status: string;
  profileCompleted: boolean;
};

export async function findPartnerByCR(cr: string): Promise<{ partner: OdooPartnerRef; profile: OdooSupplierProfileRef } | null> {
  const normalized = normalizeCR(cr);
  if (!normalized) return null;
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_status: string;
    x_studio_profile_completed: boolean;
  }>(
    "x_build_supplier_profile",
    [["x_studio_cr_number", "=", normalized]],
    ["x_studio_partner_id", "x_studio_status", "x_studio_profile_completed"],
    { limit: 1 }
  );
  const row = rows[0];
  if (!row || !row.x_studio_partner_id) return null;
  return {
    partner: { id: row.x_studio_partner_id[0], name: row.x_studio_partner_id[1] },
    profile: {
      id: row.id,
      partnerId: row.x_studio_partner_id[0],
      status: row.x_studio_status,
      profileCompleted: Boolean(row.x_studio_profile_completed),
    },
  };
}

export async function findPartnerByVAT(vat: string): Promise<{ partner: OdooPartnerRef; profile: OdooSupplierProfileRef } | null> {
  const normalized = normalizeVAT(vat);
  if (!normalized) return null;
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_status: string;
    x_studio_profile_completed: boolean;
  }>(
    "x_build_supplier_profile",
    [["x_studio_vat_number", "=", normalized]],
    ["x_studio_partner_id", "x_studio_status", "x_studio_profile_completed"],
    { limit: 1 }
  );
  const row = rows[0];
  if (!row || !row.x_studio_partner_id) return null;
  return {
    partner: { id: row.x_studio_partner_id[0], name: row.x_studio_partner_id[1] },
    profile: {
      id: row.id,
      partnerId: row.x_studio_partner_id[0],
      status: row.x_studio_status,
      profileCompleted: Boolean(row.x_studio_profile_completed),
    },
  };
}

export async function findPartnerByEmail(email: string): Promise<OdooPartnerRef | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const rows = await searchRead<{ id: number; name: string }>(
    "res.partner",
    [["email", "=ilike", normalized]],
    ["name"],
    { limit: 1 }
  );
  const row = rows[0];
  return row ? { id: row.id, name: row.name } : null;
}

export async function findPartnerByPhone(phone: string): Promise<OdooPartnerRef | null> {
  const normalized = normalizeSaudiPhone(phone);
  if (!normalized) return null;
  // res.partner في هذي القاعدة بلا حقل mobile منفصل — نعتمد phone_sanitized (المعياري بلا تنسيق) للمطابقة الموثوقة
  const rows = await searchRead<{ id: number; name: string }>(
    "res.partner",
    [["phone_sanitized", "=", normalized]],
    ["name"],
    { limit: 1 }
  );
  const row = rows[0];
  return row ? { id: row.id, name: row.name } : null;
}

export async function findSupplierProfileByPartner(partnerId: number): Promise<OdooSupplierProfileRef | null> {
  const rows = await searchRead<{ id: number; x_studio_status: string; x_studio_profile_completed: boolean }>(
    "x_build_supplier_profile",
    [["x_studio_partner_id", "=", partnerId]],
    ["x_studio_status", "x_studio_profile_completed"],
    { limit: 1 }
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    partnerId,
    status: row.x_studio_status,
    profileCompleted: Boolean(row.x_studio_profile_completed),
  };
}

// ─────────────────────────────────────────────────────────────
// Supplier registration writes
// ─────────────────────────────────────────────────────────────

export async function createSupplierPartner(data: {
  establishmentName: string;
  email: string;
  phone: string;
}): Promise<number> {
  return create("res.partner", {
    name: data.establishmentName,
    is_company: true,
    email: normalizeEmail(data.email),
    phone: normalizeSaudiPhone(data.phone),
  });
}

export async function createSupplierProfile(
  partnerId: number,
  data: {
    supplierType: "local" | "international";
    crNumber: string;
    vatNumber?: string;
    managerName?: string;
  }
): Promise<number> {
  return create("x_build_supplier_profile", {
    x_studio_partner_id: partnerId,
    x_studio_supplier_type: data.supplierType,
    x_studio_cr_number: normalizeCR(data.crNumber),
    x_studio_vat_number: data.vatNumber ? normalizeVAT(data.vatNumber) : false,
    x_studio_status: "draft",
    x_studio_profile_completed: false,
    x_studio_active_flag: true,
    x_studio_internal_notes: data.managerName ? `المسؤول: ${data.managerName}` : false,
  });
}

export async function updatePreRegistration(
  profileId: number,
  data: { internalNotes?: string }
): Promise<void> {
  await write("x_build_supplier_profile", [profileId], {
    x_studio_status: "draft",
    ...(data.internalNotes ? { x_studio_internal_notes: data.internalNotes } : {}),
  });
}

// ─────────────────────────────────────────────────────────────
// Outbox
// ─────────────────────────────────────────────────────────────

export async function createOutboxEvent(params: {
  eventType: string;
  resourceModel: string;
  resourceId: number;
  supplierProfileId?: number;
  carrierProfileId?: number;
  idempotencyKey: string;
  /** يُحتفظ به محدوداً — IDs ومعلومات إرسال فقط، لا أسرار ولا بيانات حساسة */
  payload: Record<string, unknown>;
}): Promise<{ id: number; created: boolean }> {
  const existing = await searchRead<{ id: number }>(
    "x_build_integration_outbox",
    [["x_studio_idempotency_key", "=", params.idempotencyKey]],
    ["id"],
    { limit: 1 }
  );
  if (existing[0]) {
    return { id: existing[0].id, created: false };
  }

  const id = await create("x_build_integration_outbox", {
    x_studio_event_id: params.idempotencyKey,
    x_studio_event_type: params.eventType,
    x_studio_resource_model: params.resourceModel,
    x_studio_resource_id: params.resourceId,
    x_studio_supplier_profile_id: params.supplierProfileId ?? false,
    x_studio_carrier_profile_id: params.carrierProfileId ?? false,
    x_studio_idempotency_key: params.idempotencyKey,
    x_studio_status: "pending",
    x_studio_attempts: 0,
    x_studio_max_attempts: 5,
    x_studio_payload_json: JSON.stringify(params.payload),
  });
  return { id, created: true };
}
