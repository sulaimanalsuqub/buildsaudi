import { randomUUID } from "crypto";
import { normalizeVendorPhone } from "@/lib/vendor-options";

/**
 * عميل Odoo مستقل (JSON-RPC) — النظام الوحيد المعتمد لرحلة تسجيل الموردين.
 * الواجهة مصممة لشكل بيانات Odoo نفسه.
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
    raw: params.base64Data,
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
// 2A-2: تسجيل أولي خفيف (بلا CR/VAT/بنك) + منع تكرار موسّع
// ─────────────────────────────────────────────────────────────

export function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function extractWebsiteDomain(url: string): string {
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProto).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export type PreliminaryRegistrationInput = {
  establishmentName: string;
  /** اسم الدولة المعروض (وليس رمزها الداخلي) — يُخزَّن كما هو في هذا الحقل النصي التوصيفي */
  country: string;
  supplierType: "local" | "international";
  contactName: string;
  jobTitle?: string;
  email: string;
  phone: string;
  shortDescription: string;
  website?: string;
  catalogLink?: string;
  preferredLanguage: "ar" | "en";
  policyVersion: string;
  consentAt: string;
  /** يُحفَظ للمراجعة اليدوية فقط — لا يُنشئ فئة جديدة تلقائياً */
  otherCategorySuggestion?: string;
};

function normalizeCountry(country: string): string {
  return country.trim().toLowerCase();
}

/** يبحث عن ملف مورد بنفس البريد + نفس اسم المنشأة (بعد التطبيع) + نفس الدولة */
export async function findSupplierByEmailNameCountry(
  email: string,
  establishmentName: string,
  country: string
): Promise<{ partner: OdooPartnerRef; profile: OdooSupplierProfileRef } | null> {
  const partner = await findPartnerByEmail(email);
  if (!partner) return null;
  const profile = await findSupplierProfileByPartner(partner.id);
  if (!profile) return null;
  const rows = await read<{ x_studio_country_name: string | false }>("x_build_supplier_profile", [profile.id], [
    "x_studio_country_name",
  ]);
  const partnerRows = await read<{ name: string }>("res.partner", [partner.id], ["name"]);
  const sameName = normalizeCompanyName(partnerRows[0]?.name ?? "") === normalizeCompanyName(establishmentName);
  const sameCountry = normalizeCountry(rows[0]?.x_studio_country_name || "") === normalizeCountry(country);
  if (!sameName || !sameCountry) return null;
  return { partner, profile };
}

/** يبحث عن ملف مورد بنفس اسم المنشأة + الدولة (بصرف النظر عن البريد/الجوال) */
export async function findSupplierByNameAndCountry(
  establishmentName: string,
  country: string
): Promise<{ partner: OdooPartnerRef; profile: OdooSupplierProfileRef } | null> {
  const normalizedName = normalizeCompanyName(establishmentName);
  const normalizedCountry = normalizeCountry(country);
  const candidates = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_status: string;
    x_studio_profile_completed: boolean;
    x_studio_country_name: string | false;
  }>(
    "x_build_supplier_profile",
    [],
    ["x_studio_partner_id", "x_studio_status", "x_studio_profile_completed", "x_studio_country_name"],
    { limit: 200 }
  );
  for (const c of candidates) {
    if (!c.x_studio_partner_id) continue;
    if (
      normalizeCompanyName(c.x_studio_partner_id[1]) === normalizedName &&
      normalizeCountry(c.x_studio_country_name || "") === normalizedCountry
    ) {
      return {
        partner: { id: c.x_studio_partner_id[0], name: c.x_studio_partner_id[1] },
        profile: {
          id: c.id,
          partnerId: c.x_studio_partner_id[0],
          status: c.x_studio_status,
          profileCompleted: Boolean(c.x_studio_profile_completed),
        },
      };
    }
  }
  return null;
}

export async function createPreliminaryPartner(data: {
  establishmentName: string;
  email: string;
  phone: string;
  website?: string;
}): Promise<number> {
  return create("res.partner", {
    name: data.establishmentName,
    is_company: true,
    email: normalizeEmail(data.email),
    phone: normalizeSaudiPhone(data.phone),
    website: data.website || false,
  });
}

export async function createPreliminarySupplierProfile(
  partnerId: number,
  data: PreliminaryRegistrationInput,
  categoryIds: number[],
  brandIds: number[]
): Promise<number> {
  return create("x_build_supplier_profile", {
    x_studio_partner_id: partnerId,
    x_studio_supplier_type: data.supplierType,
    x_studio_country_name: data.country,
    x_studio_status: "under_preliminary_review",
    x_studio_profile_completed: false,
    x_studio_active_flag: true,
    x_studio_job_title: data.jobTitle || false,
    x_studio_short_description: data.shortDescription,
    x_studio_website: data.website || false,
    x_studio_website_domain: data.website ? extractWebsiteDomain(data.website) : false,
    x_studio_catalog_link: data.catalogLink || false,
    x_studio_preferred_language: data.preferredLanguage,
    x_studio_privacy_accepted: true,
    x_studio_terms_accepted: true,
    x_studio_policy_version: data.policyVersion,
    x_studio_consent_at: data.consentAt,
    x_studio_internal_notes: `المسؤول: ${data.contactName}`,
    x_studio_material_category_ids: categoryIds.length ? [[6, 0, categoryIds]] : false,
    x_studio_brand_ids: brandIds.length ? [[6, 0, brandIds]] : false,
    x_studio_other_category_suggestion: data.otherCategorySuggestion || false,
  });
}

// ─────────────────────────────────────────────────────────────
// رحلة الناقل (Carrier) — تسجيل أولي، مطابقة تماماً لنمط المورد
// ─────────────────────────────────────────────────────────────

export type OdooCarrierProfileRef = {
  id: number;
  partnerId: number;
  status: string;
  profileCompleted: boolean;
};

export type PreliminaryCarrierRegistrationInput = {
  establishmentName: string;
  country: string;
  carrierType: "local" | "international";
  contactName: string;
  jobTitle?: string;
  email: string;
  phone: string;
  serviceAreas: string[];
  vehicleTypes: string[];
  materialCategories: string[];
  shortDescription: string;
  website?: string;
  preferredLanguage: "ar" | "en";
  policyVersion: string;
  consentAt: string;
};

export async function findCarrierProfileByPartner(partnerId: number): Promise<OdooCarrierProfileRef | null> {
  const rows = await searchRead<{ id: number; x_studio_status: string; x_studio_profile_completed: boolean }>(
    "x_build_carrier_profile",
    [["x_studio_partner_id", "=", partnerId]],
    ["x_studio_status", "x_studio_profile_completed"],
    { limit: 1 }
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, partnerId, status: row.x_studio_status, profileCompleted: Boolean(row.x_studio_profile_completed) };
}

/** يبحث عن ملف ناقل بنفس البريد + نفس اسم المنشأة (بعد التطبيع) + نفس الدولة */
export async function findCarrierByEmailNameCountry(
  email: string,
  establishmentName: string,
  country: string
): Promise<{ partner: OdooPartnerRef; profile: OdooCarrierProfileRef } | null> {
  const partner = await findPartnerByEmail(email);
  if (!partner) return null;
  const profile = await findCarrierProfileByPartner(partner.id);
  if (!profile) return null;
  const rows = await read<{ x_studio_country_name: string | false }>("x_build_carrier_profile", [profile.id], [
    "x_studio_country_name",
  ]);
  const partnerRows = await read<{ name: string }>("res.partner", [partner.id], ["name"]);
  const sameName = normalizeCompanyName(partnerRows[0]?.name ?? "") === normalizeCompanyName(establishmentName);
  const sameCountry = normalizeCountry(rows[0]?.x_studio_country_name || "") === normalizeCountry(country);
  if (!sameName || !sameCountry) return null;
  return { partner, profile };
}

/** يبحث عن ملف ناقل بنفس اسم المنشأة + الدولة (بصرف النظر عن البريد/الجوال) */
export async function findCarrierByNameAndCountry(
  establishmentName: string,
  country: string
): Promise<{ partner: OdooPartnerRef; profile: OdooCarrierProfileRef } | null> {
  const normalizedName = normalizeCompanyName(establishmentName);
  const normalizedCountry = normalizeCountry(country);
  const candidates = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_status: string;
    x_studio_profile_completed: boolean;
    x_studio_country_name: string | false;
  }>(
    "x_build_carrier_profile",
    [],
    ["x_studio_partner_id", "x_studio_status", "x_studio_profile_completed", "x_studio_country_name"],
    { limit: 200 }
  );
  for (const c of candidates) {
    if (!c.x_studio_partner_id) continue;
    if (
      normalizeCompanyName(c.x_studio_partner_id[1]) === normalizedName &&
      normalizeCountry(c.x_studio_country_name || "") === normalizedCountry
    ) {
      return {
        partner: { id: c.x_studio_partner_id[0], name: c.x_studio_partner_id[1] },
        profile: {
          id: c.id,
          partnerId: c.x_studio_partner_id[0],
          status: c.x_studio_status,
          profileCompleted: Boolean(c.x_studio_profile_completed),
        },
      };
    }
  }
  return null;
}

export async function createPreliminaryCarrierProfile(
  partnerId: number,
  data: PreliminaryCarrierRegistrationInput,
  serviceAreaIds: number[],
  vehicleTypeIds: number[],
  materialCategoryIds: number[]
): Promise<number> {
  return create("x_build_carrier_profile", {
    x_studio_partner_id: partnerId,
    x_studio_carrier_type: data.carrierType,
    x_studio_country_name: data.country,
    x_studio_status: "under_preliminary_review",
    x_studio_profile_completed: false,
    x_studio_active_flag: true,
    x_studio_job_title: data.jobTitle || false,
    x_studio_short_description: data.shortDescription,
    x_studio_website: data.website || false,
    x_studio_website_domain: data.website ? extractWebsiteDomain(data.website) : false,
    x_studio_preferred_language: data.preferredLanguage,
    x_studio_privacy_accepted: true,
    x_studio_terms_accepted: true,
    x_studio_policy_version: data.policyVersion,
    x_studio_consent_at: data.consentAt,
    x_studio_internal_notes: `المسؤول: ${data.contactName}`,
    x_studio_service_area_ids: serviceAreaIds.length ? [[6, 0, serviceAreaIds]] : false,
    x_studio_vehicle_type_ids: vehicleTypeIds.length ? [[6, 0, vehicleTypeIds]] : false,
    x_studio_material_category_ids: materialCategoryIds.length ? [[6, 0, materialCategoryIds]] : false,
  });
}

/** فحص تكرار نهائي بعد استكمال الملف — محلي: CR أو VAT مطابق لملف ناقل آخر */
export async function findDuplicateLocalCarrierProfile(
  crNumber: string,
  vatNumber: string,
  excludeProfileId: number
): Promise<boolean> {
  const normCr = normalizeCR(crNumber);
  const normVat = normalizeVAT(vatNumber);
  const rows = await searchRead<{ id: number }>(
    "x_build_carrier_profile",
    ["&", ["id", "!=", excludeProfileId], "|", ["x_studio_cr_number", "=", normCr], ["x_studio_vat_number", "=", normVat]],
    ["id"],
    { limit: 1 }
  );
  return rows.length > 0;
}

/** فحص تكرار نهائي بعد استكمال الملف — دولي: دولة التسجيل (معرف res.country) + رقم التسجيل مطابقان لملف ناقل آخر */
export async function findDuplicateInternationalCarrierProfile(
  countryOfRegistrationId: number,
  registrationNumber: string,
  excludeProfileId: number
): Promise<boolean> {
  const normalized = registrationNumber.trim().toLowerCase();
  const rows = await searchRead<{ id: number }>(
    "x_build_carrier_profile",
    [
      ["id", "!=", excludeProfileId],
      ["x_studio_country_of_registration", "=", countryOfRegistrationId],
      ["x_studio_registration_number", "=", normalized],
    ],
    ["id"],
    { limit: 1 }
  );
  return rows.length > 0;
}

export type CarrierNotificationProfile = {
  id: number;
  partnerId: number;
  establishmentName: string;
  managerName: string;
  email: string;
  preferredLanguage: "ar" | "en";
  tokenVersion: number;
  missingInfoRequested: string;
  rejectionReasonExternal: string;
  finalMoreInfoRequested: string;
  suspendedReason: string;
};

export async function getCarrierProfileForNotification(profileId: number): Promise<CarrierNotificationProfile | null> {
  const rows = await read<{
    x_studio_partner_id: [number, string] | false;
    x_studio_preferred_language: "ar" | "en" | false;
    x_studio_token_version: number | false;
    x_studio_missing_info_requested: string | false;
    x_studio_rejection_reason_external: string | false;
    x_studio_final_more_info_requested: string | false;
    x_studio_suspended_reason: string | false;
    x_studio_internal_notes: string | false;
  }>("x_build_carrier_profile", [profileId], [
    "x_studio_partner_id",
    "x_studio_preferred_language",
    "x_studio_token_version",
    "x_studio_missing_info_requested",
    "x_studio_rejection_reason_external",
    "x_studio_final_more_info_requested",
    "x_studio_suspended_reason",
    "x_studio_internal_notes",
  ]);
  const row = rows[0];
  if (!row || !row.x_studio_partner_id) return null;

  const partnerRows = await read<{ name: string; email: string | false }>(
    "res.partner",
    [row.x_studio_partner_id[0]],
    ["name", "email"]
  );
  const partner = partnerRows[0];
  if (!partner?.email) return null;

  return {
    id: profileId,
    partnerId: row.x_studio_partner_id[0],
    establishmentName: partner.name,
    managerName: extractManagerName(row.x_studio_internal_notes) || partner.name,
    email: partner.email,
    preferredLanguage: row.x_studio_preferred_language || "ar",
    tokenVersion: row.x_studio_token_version || 1,
    missingInfoRequested: row.x_studio_missing_info_requested || "",
    rejectionReasonExternal: row.x_studio_rejection_reason_external || "",
    finalMoreInfoRequested: row.x_studio_final_more_info_requested || "",
    suspendedReason: row.x_studio_suspended_reason || "",
  };
}

/** حفظ مسودة قسم من نموذج الاستكمال — لا يُنشئ Outbox Event، فقط يحدّث حقل JSON + وقت الحفظ */
const PROFILE_MODEL: Record<"supplier" | "carrier", string> = {
  supplier: "x_build_supplier_profile",
  carrier: "x_build_carrier_profile",
};

export async function saveOnboardingDraft(kind: "supplier" | "carrier", profileId: number, draftData: Record<string, unknown>): Promise<void> {
  await write(PROFILE_MODEL[kind], [profileId], {
    x_studio_draft_data_json: JSON.stringify(draftData),
    x_studio_last_saved_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  });
}

export async function getOnboardingDraft(kind: "supplier" | "carrier", profileId: number): Promise<Record<string, unknown> | null> {
  const rows = await read<{ x_studio_draft_data_json: string | false }>(PROFILE_MODEL[kind], [profileId], [
    "x_studio_draft_data_json",
  ]);
  const raw = rows[0]?.x_studio_draft_data_json;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** كتابة عامة محدودة الحقول المسموحة — تُستخدم في مرحلة استكمال الملف (مورد أو ناقل) */
export async function updateOnboardingProfile(kind: "supplier" | "carrier", profileId: number, fields: Record<string, unknown>): Promise<void> {
  await write(PROFILE_MODEL[kind], [profileId], fields);
}

/** يحلّ اسم دولة (عربي أو إنجليزي) إلى معرف res.country — لا يُنشئ دولاً جديدة */
export async function resolveCountryId(name: string): Promise<number | false> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  for (const lang of ["ar_001", "en_US"]) {
    const rows = await callMethod<Array<{ id: number; name: string }>>(
      "res.country",
      "search_read",
      [[["name", "ilike", trimmed]]],
      { fields: ["id", "name"], limit: 1, context: { lang } }
    );
    if (rows[0]) return rows[0].id;
  }
  return false;
}

/** فحص تكرار نهائي بعد استكمال الملف — محلي: CR أو VAT مطابق لملف آخر */
export async function findDuplicateLocalProfile(
  crNumber: string,
  vatNumber: string,
  excludeProfileId: number
): Promise<boolean> {
  const normCr = normalizeCR(crNumber);
  const normVat = normalizeVAT(vatNumber);
  // رقم الضريبي أصبح اختيارياً — لا نطابق عليه إن كان فارغاً حتى لا يتصادم كل الملفات بلا رقم ضريبي مع بعضها
  const domain = normVat
    ? ["&", ["id", "!=", excludeProfileId], "|", ["x_studio_cr_number", "=", normCr], ["x_studio_vat_number", "=", normVat]]
    : ["&", ["id", "!=", excludeProfileId], ["x_studio_cr_number", "=", normCr]];
  const rows = await searchRead<{ id: number }>(
    "x_build_supplier_profile",
    domain,
    ["id"],
    { limit: 1 }
  );
  return rows.length > 0;
}

/** فحص تكرار نهائي بعد استكمال الملف — دولي: دولة التسجيل (معرف res.country) + رقم التسجيل مطابقان لملف آخر */
export async function findDuplicateInternationalProfile(
  countryOfRegistrationId: number,
  registrationNumber: string,
  excludeProfileId: number
): Promise<boolean> {
  const normalized = registrationNumber.trim().toLowerCase();
  const rows = await searchRead<{ id: number }>(
    "x_build_supplier_profile",
    [
      ["id", "!=", excludeProfileId],
      ["x_studio_country_of_registration", "=", countryOfRegistrationId],
      ["x_studio_registration_number", "=", normalized],
    ],
    ["id"],
    { limit: 1 }
  );
  return rows.length > 0;
}

/** يطابق فقط ضد سجلات نشطة موجودة مسبقاً — لا يُنشئ أي سجل جديد. يُعيد null إن كانت أي قيمة غير معروفة (رفض بدل تلويث Master Data من مدخلات عامة غير موثوقة) */
async function resolveExistingActiveLookup(model: string, names: string[]): Promise<number[] | null> {
  const trimmed = names.map((n) => n.trim()).filter(Boolean);
  if (!trimmed.length) return [];
  const existing = await searchRead<{ id: number; x_studio_name: string }>(
    model,
    [["x_studio_active_flag", "=", true]],
    ["x_studio_name"],
    { limit: 500 }
  );
  const ids: number[] = [];
  for (const name of trimmed) {
    const normalized = name.toLowerCase().replace(/\s+/g, " ");
    const match = existing.find((r) => r.x_studio_name.trim().toLowerCase().replace(/\s+/g, " ") === normalized);
    if (!match) return null;
    ids.push(match.id);
  }
  return ids;
}

export async function resolveActiveServiceAreas(names: string[]): Promise<number[] | null> {
  return resolveExistingActiveLookup("x_build_service_area", names);
}

export async function resolveActiveVehicleTypes(names: string[]): Promise<number[] | null> {
  return resolveExistingActiveLookup("x_build_vehicle_type", names);
}

export async function resolveActiveCarrierCategories(names: string[]): Promise<number[] | null> {
  return resolveExistingActiveLookup("x_build_material_category", names);
}

/** يبحث عن قيمة موجودة في قائمة مرجعية (بعد تطبيع بسيط) أو ينشئها — يُستخدم للعلامات/مناطق الخدمة/المركبات المُدخلة كنص من الموقع */
async function resolveOrCreateLookup(model: string, names: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const normalized = name.toLowerCase().replace(/\s+/g, " ");
    const existing = await searchRead<{ id: number; x_studio_name: string }>(model, [], ["x_studio_name"], { limit: 500 });
    const match = existing.find((r) => r.x_studio_name.trim().toLowerCase().replace(/\s+/g, " ") === normalized);
    if (match) {
      ids.push(match.id);
    } else {
      // x_name يُملأ أيضاً — هو الحقل الفعلي الذي يعرضه Odoo كاسم السجل (Display Name)، إغفاله ينتج "غير مسمى"
      const id = await create(model, { x_name: name, x_studio_name: name, x_studio_active_flag: true });
      ids.push(id);
    }
  }
  return ids;
}

export type MaterialCategoryOption = {
  id: number;
  nameAr: string;
  nameEn: string;
};

/** فئات المواد الرئيسية النشطة — Master Data تُدار من داخل Odoo فقط، الموقع يقرأها ولا ينشئها */
export async function listActiveMaterialCategories(): Promise<MaterialCategoryOption[]> {
  const rows = await searchRead<{
    id: number;
    x_studio_name: string;
    x_studio_name_en: string | false;
    x_studio_sequence: number | false;
  }>(
    "x_build_material_category",
    [["x_studio_active_flag", "=", true]],
    ["x_studio_name", "x_studio_name_en", "x_studio_sequence"],
    { order: "id asc", limit: 200 }
  );
  return rows
    .map((r) => ({ id: r.id, nameAr: r.x_studio_name, nameEn: r.x_studio_name_en || r.x_studio_name, seq: r.x_studio_sequence || 0 }))
    .sort((a, b) => a.seq - b.seq)
    .map(({ id, nameAr, nameEn }) => ({ id, nameAr, nameEn }));
}

/** يتحقق أن كل معرّف فئة موجود فعلياً ونشط في Odoo — لا يثق بأي شيء أرسله المتصفح بلا تحقق */
export async function validateActiveCategoryIds(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return false;
  const rows = await searchRead<{ id: number }>(
    "x_build_material_category",
    [
      ["id", "in", ids],
      ["x_studio_active_flag", "=", true],
    ],
    ["id"]
  );
  return rows.length === ids.length;
}

/** يكتب فئات الطلب المستنتجة من البنود المستخرجة آلياً — أساس اقتراح الموردين */
export async function updateProcurementRequestCategories(requestId: number, categoryIds: number[]): Promise<void> {
  if (!categoryIds.length) return;
  await write("x_build_procurement_request", [requestId], {
    x_studio_material_category_ids: [[6, 0, categoryIds]],
  });
}

export type MatchingSupplier = {
  id: number;
  partnerId: number;
  name: string;
  matchedCategoryCount: number;
};

/** يبحث عن الموردين المؤهَّلين للمطابقة (eligible_for_matching) اللي تتقاطع فئاتهم مع فئات الطلب — مرتَّبين حسب عدد الفئات المتطابقة */
export async function findMatchingSuppliers(categoryIds: number[]): Promise<MatchingSupplier[]> {
  if (!categoryIds.length) return [];
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_material_category_ids: number[];
  }>(
    "x_build_supplier_profile",
    [
      ["x_studio_eligible_for_matching", "=", true],
      ["x_studio_active_flag", "=", true],
      ["x_studio_material_category_ids", "in", categoryIds],
    ],
    ["x_studio_partner_id", "x_studio_material_category_ids"]
  );
  return rows
    .filter((row): row is typeof row & { x_studio_partner_id: [number, string] } => !!row.x_studio_partner_id)
    .map((row) => ({
      id: row.id,
      partnerId: row.x_studio_partner_id[0],
      name: row.x_studio_partner_id[1],
      matchedCategoryCount: row.x_studio_material_category_ids.filter((id) => categoryIds.includes(id)).length,
    }))
    .sort((a, b) => b.matchedCategoryCount - a.matchedCategoryCount);
}

/** يزامن "مؤهَّل للمطابقة" مع حالة الاعتماد تلقائياً — يفعّله عند "approved"، يعطّله لو الحالة تغيّرت لأي شيء آخر (رفض/تعليق بعد اعتماد سابق). يعيد عدد التغييرات بالاتجاهين */
export async function syncSupplierMatchingEligibility(): Promise<{ enabled: number; disabled: number }> {
  const toEnable = await searchRead<{ id: number }>(
    "x_build_supplier_profile",
    [
      ["x_studio_status", "=", "approved"],
      ["x_studio_eligible_for_matching", "=", false],
    ],
    ["id"]
  );
  if (toEnable.length) {
    await write("x_build_supplier_profile", toEnable.map((r) => r.id), { x_studio_eligible_for_matching: true });
  }

  const toDisable = await searchRead<{ id: number }>(
    "x_build_supplier_profile",
    [
      ["x_studio_status", "!=", "approved"],
      ["x_studio_eligible_for_matching", "=", true],
    ],
    ["id"]
  );
  if (toDisable.length) {
    await write("x_build_supplier_profile", toDisable.map((r) => r.id), { x_studio_eligible_for_matching: false });
  }

  return { enabled: toEnable.length, disabled: toDisable.length };
}

/** يضيف ملاحظة داخلية على سجل الطلب (Odoo chatter) — لا يُنشئ حقلاً جديداً، يستخدم آلية الرسائل المدمجة في أودو */
export async function postProcurementRequestNote(requestId: number, body: string): Promise<void> {
  await executeKw("x_build_procurement_request", "message_post", [[requestId]], { body });
}

export async function resolveOrCreateBrands(names: string[]): Promise<number[]> {
  return resolveOrCreateLookup("x_build_brand", names);
}

// ─────────────────────────────────────────────────────────────
// 2A-7: مستندات المورد (Build Supplier Document)
// ─────────────────────────────────────────────────────────────

export type SupplierDocumentType =
  | "cr_certificate"
  | "vat_certificate"
  | "bank_letter"
  | "national_address"
  | "registration_certificate"
  | "license"
  | "insurance"
  | "vehicle_registration"
  | "other";

export type SupplierDocumentRow = {
  id: number;
  x_studio_document_type: SupplierDocumentType;
  x_studio_file_name: string;
  x_studio_mimetype: string | false;
  x_studio_file_size: number | false;
  x_studio_uploaded_at: string | false;
  x_studio_verification_status: "pending" | "verified" | "rejected";
  x_studio_is_current: boolean;
  x_studio_version: number;
};

/** يرفع مستنداً جديداً كإصدار حالي (مورد أو ناقل)، ويطفئ is_current عن أي نسخة سابقة من نفس النوع لنفس الملف */
export async function createOnboardingDocument(params: {
  kind: "supplier" | "carrier";
  profileId: number;
  documentType: SupplierDocumentType;
  fileName: string;
  base64Data: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
}): Promise<number> {
  const fkField = params.kind === "carrier" ? "x_studio_carrier_profile_id" : "x_studio_supplier_profile_id";

  const previous = await searchRead<{ id: number; x_studio_version: number }>(
    "x_build_supplier_document",
    [
      [fkField, "=", params.profileId],
      ["x_studio_document_type", "=", params.documentType],
      ["x_studio_is_current", "=", true],
    ],
    ["x_studio_version"]
  );

  const nextVersion = (previous[0]?.x_studio_version ?? 0) + 1;
  if (previous.length) {
    await write(
      "x_build_supplier_document",
      previous.map((p) => p.id),
      { x_studio_is_current: false }
    );
  }

  const attachment = await createAttachment({
    name: params.fileName,
    base64Data: params.base64Data,
    resModel: "x_build_supplier_document",
    resId: 0,
    mimeType: params.mimeType,
  });

  const docId = await create("x_build_supplier_document", {
    [fkField]: params.profileId,
    x_name: params.fileName,
    x_studio_document_type: params.documentType,
    x_studio_attachment_id: attachment.id,
    x_studio_file_name: params.fileName,
    x_studio_mimetype: params.mimeType,
    x_studio_file_size: params.fileSize,
    x_studio_checksum_sha256: params.checksumSha256,
    x_studio_uploaded_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    x_studio_upload_source: "vendor_portal",
    x_studio_verification_status: "pending",
    x_studio_is_current: true,
    x_studio_version: nextVersion,
    x_studio_visible_to_supplier: true,
  });

  await write("ir.attachment", [attachment.id], { res_id: docId });

  return docId;
}

export type ExpiringDocumentRow = {
  id: number;
  x_studio_supplier_profile_id: [number, string] | false;
  x_studio_carrier_profile_id: [number, string] | false;
  x_studio_document_type: SupplierDocumentType;
  x_studio_expiry_date: string;
  x_studio_expiry_alert_60_sent: boolean;
  x_studio_expiry_alert_30_sent: boolean;
  x_studio_expiry_alert_7_sent: boolean;
  x_studio_expiry_alert_0_sent: boolean;
};

/** كل المستندات الحالية (is_current) التي لها تاريخ انتهاء (مورد أو ناقل) — تُفلتَر بالأيام المتبقية على مستوى المستدعي */
export async function listDocumentsWithExpiry(): Promise<ExpiringDocumentRow[]> {
  return searchRead<ExpiringDocumentRow>(
    "x_build_supplier_document",
    [
      ["x_studio_is_current", "=", true],
      ["x_studio_expiry_date", "!=", false],
    ],
    [
      "x_studio_supplier_profile_id",
      "x_studio_carrier_profile_id",
      "x_studio_document_type",
      "x_studio_expiry_date",
      "x_studio_expiry_alert_60_sent",
      "x_studio_expiry_alert_30_sent",
      "x_studio_expiry_alert_7_sent",
      "x_studio_expiry_alert_0_sent",
    ],
    { limit: 1000 }
  );
}

export async function listOnboardingDocuments(kind: "supplier" | "carrier", profileId: number): Promise<SupplierDocumentRow[]> {
  const fkField = kind === "carrier" ? "x_studio_carrier_profile_id" : "x_studio_supplier_profile_id";
  return searchRead<SupplierDocumentRow>(
    "x_build_supplier_document",
    [
      [fkField, "=", profileId],
      ["x_studio_is_current", "=", true],
    ],
    [
      "x_studio_document_type",
      "x_studio_file_name",
      "x_studio_mimetype",
      "x_studio_file_size",
      "x_studio_uploaded_at",
      "x_studio_verification_status",
      "x_studio_is_current",
      "x_studio_version",
    ]
  );
}

// ─────────────────────────────────────────────────────────────
// 2A-9: بيانات الإشعار — تُقرأ من Odoo وقت الإرسال (لا تُخزَّن في Outbox)
// ─────────────────────────────────────────────────────────────

export type SupplierNotificationProfile = {
  id: number;
  partnerId: number;
  establishmentName: string;
  managerName: string;
  email: string;
  preferredLanguage: "ar" | "en";
  tokenVersion: number;
  missingInfoRequested: string;
  rejectionReasonExternal: string;
  finalMoreInfoRequested: string;
  suspendedReason: string;
};

function extractManagerName(internalNotes: string | false): string {
  const match = typeof internalNotes === "string" ? internalNotes.match(/المسؤول:\s*(.+)/) : null;
  return match ? match[1].trim() : "";
}

export async function getSupplierProfileForNotification(profileId: number): Promise<SupplierNotificationProfile | null> {
  const rows = await read<{
    x_studio_partner_id: [number, string] | false;
    x_studio_preferred_language: "ar" | "en" | false;
    x_studio_token_version: number | false;
    x_studio_missing_info_requested: string | false;
    x_studio_rejection_reason_external: string | false;
    x_studio_final_more_info_requested: string | false;
    x_studio_suspended_reason: string | false;
    x_studio_internal_notes: string | false;
  }>("x_build_supplier_profile", [profileId], [
    "x_studio_partner_id",
    "x_studio_preferred_language",
    "x_studio_token_version",
    "x_studio_missing_info_requested",
    "x_studio_rejection_reason_external",
    "x_studio_final_more_info_requested",
    "x_studio_suspended_reason",
    "x_studio_internal_notes",
  ]);
  const row = rows[0];
  if (!row || !row.x_studio_partner_id) return null;

  const partnerRows = await read<{ name: string; email: string | false }>(
    "res.partner",
    [row.x_studio_partner_id[0]],
    ["name", "email"]
  );
  const partner = partnerRows[0];
  if (!partner?.email) return null;

  return {
    id: profileId,
    partnerId: row.x_studio_partner_id[0],
    establishmentName: partner.name,
    managerName: extractManagerName(row.x_studio_internal_notes) || partner.name,
    email: partner.email,
    preferredLanguage: row.x_studio_preferred_language || "ar",
    tokenVersion: row.x_studio_token_version || 1,
    missingInfoRequested: row.x_studio_missing_info_requested || "",
    rejectionReasonExternal: row.x_studio_rejection_reason_external || "",
    finalMoreInfoRequested: row.x_studio_final_more_info_requested || "",
    suspendedReason: row.x_studio_suspended_reason || "",
  };
}

// ─────────────────────────────────────────────────────────────
// طلبات التوريد (Customer Procurement Requests) — استقبال فقط بهذي المرحلة
// المطابقة/RFQ/التسعير/الشحن تبقى يدوية بأودو (إجراءات جاهزة من مرحلة سابقة)
// ─────────────────────────────────────────────────────────────

export type ProcurementRequestInput = {
  contactName: string;
  companyName?: string;
  email: string;
  phone: string;
  /** المشروع أهم بيانات الطلب — إلزامي */
  projectName: string;
  deliveryAddressNotes?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  nationalAddressCode?: string;
  requestedDeliveryDate?: string;
  description: string;
};

/** يبحث عن عميل بنفس البريد، وإلا ينشئ سجلاً جديداً — يتيح ربط طلبات نفس العميل ببعضها لاحقاً */
export async function findOrCreateCustomerPartner(data: { contactName: string; companyName?: string; email: string; phone: string }): Promise<number> {
  const existing = await findPartnerByEmail(data.email);
  if (existing) return existing.id;
  return create("res.partner", {
    name: data.companyName || data.contactName,
    is_company: !!data.companyName,
    email: normalizeEmail(data.email),
    phone: normalizeSaudiPhone(data.phone),
  });
}

export type CustomerProject = { id: number; name: string };

/** يبحث عن مشروع نشط بنفس الاسم لهذا العميل، وإلا ينشئ سجلاً جديداً */
export async function findOrCreateCustomerProject(customerId: number, projectName: string): Promise<number> {
  const existing = await searchRead<{ id: number }>(
    "x_build_customer_project",
    [["x_studio_customer_id", "=", customerId], ["x_name", "=", projectName], ["x_studio_active_flag", "=", true]],
    ["id"],
    { limit: 1 }
  );
  if (existing[0]) return existing[0].id;
  return create("x_build_customer_project", {
    x_name: projectName,
    x_studio_customer_id: customerId,
    x_studio_active_flag: true,
  });
}

/** يخفي مشروعاً من قائمة العميل (حذف منطقي) — بعد التحقق أنه يخص نفس العميل صاحب البريد المُتحقق منه */
export async function deleteCustomerProject(projectId: number, customerId: number): Promise<boolean> {
  const rows = await read<{ x_studio_customer_id: [number, string] | false }>(
    "x_build_customer_project",
    [projectId],
    ["x_studio_customer_id"]
  );
  const row = rows[0];
  if (!row || !row.x_studio_customer_id || row.x_studio_customer_id[0] !== customerId) return false;
  await write("x_build_customer_project", [projectId], { x_studio_active_flag: false });
  return true;
}

/** ينشئ طلب توريد جديداً بحالة "جديد" — لا يُنشئ بنود مواد (تُضاف يدوياً وقت التحليل، إلا إذا أرسلها العميل مباشرة) */
export async function createProcurementRequest(
  data: ProcurementRequestInput,
  categoryIds: number[],
  customerId: number,
  projectId: number
): Promise<number> {
  return create("x_build_procurement_request", {
    x_name: data.projectName,
    x_studio_customer_id: customerId,
    x_studio_project_id: projectId,
    x_studio_contact_name: data.contactName,
    x_studio_company_name: data.companyName || false,
    x_studio_email: normalizeEmail(data.email),
    x_studio_phone: normalizeSaudiPhone(data.phone),
    x_studio_project_name: data.projectName,
    x_studio_delivery_address: data.deliveryAddressNotes || false,
    x_studio_delivery_latitude: data.deliveryLatitude ?? false,
    x_studio_delivery_longitude: data.deliveryLongitude ?? false,
    x_studio_national_address_code: data.nationalAddressCode || false,
    x_studio_requested_delivery_date: data.requestedDeliveryDate || false,
    x_studio_request_description: data.description,
    x_studio_source: "website",
    x_studio_internal_status: "new",
    x_studio_customer_status: "received",
    x_studio_request_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    x_studio_material_category_ids: categoryIds.length ? [[6, 0, categoryIds]] : false,
  });
}

/** يضيف بنود مواد بمعرفة العميل مباشرة (اسم صنف + كمية) — تبقى بحالة "جديد" بانتظار مراجعة الفريق */
export async function createCustomerRequestLines(
  requestId: number,
  items: { itemName: string; quantity: number; unit?: string; brand?: string; countryOfOrigin?: string }[]
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await create("x_build_request_line", {
      x_name: item.itemName,
      x_studio_request_id: requestId,
      x_studio_line_number: i + 1,
      x_studio_original_description: item.itemName,
      x_studio_quantity: item.quantity,
      x_studio_uom: item.unit || false,
      x_studio_brand: item.brand || false,
      x_studio_country_of_origin: item.countryOfOrigin || false,
      x_studio_line_source: "manual",
      x_studio_review_status: "new",
    });
  }
}

export type ProductCategoryOption = { id: number; name: string };

/** فئات المنتجات الرسمية بأودو (product.category) — الآباء فقط بلا فروع، تُستخدم لتصنيف الكتالوج (منفصلة عن x_build_material_category) */
export async function listProductCategories(): Promise<ProductCategoryOption[]> {
  const rows = await searchRead<{ id: number; name: string; parent_id: [number, string] | false }>(
    "product.category",
    [],
    ["name", "parent_id"],
    { limit: 200 }
  );
  return rows.filter((r) => !r.parent_id).map((r) => ({ id: r.id, name: r.name }));
}

/** أسماء المنتجات الحالية بالكتالوج — تُمرَّر لخطوة الاستخلاص حتى يعيد النموذج استخدام نفس الاسم بدل صياغة جديدة لنفس الصنف، لتقليل التكرار عند المصدر */
export async function listCatalogProductNames(): Promise<string[]> {
  const rows = await searchRead<{ name: string }>("product.product", [["active", "=", true]], ["name"], { limit: 1000 });
  return [...new Set(rows.map((r) => r.name.trim()).filter(Boolean))];
}

const UNIT_TO_UOM_ID: Record<string, number> = {
  "متر": 9,
  "م": 9,
  "متر مربع": 11,
  "كجم": 16,
  "كيلو": 16,
  "كيلوجرام": 16,
  "لتر": 13,
};
const DEFAULT_UOM_ID = 1; // Units
const PENDING_REVIEW_TAG_NAME = "بانتظار مراجعة (منتج مستخرج آلياً)";

let pendingReviewTagIdCache: number | null = null;

/** يجيب معرّف وسم "بانتظار مراجعة" (ينشئه أول مرة فقط) — يُعلَّم به كل منتج جديد يُنشأ آلياً حتى يراجعه الفريق قبل الاعتماد عليه */
async function getPendingReviewTagId(): Promise<number> {
  if (pendingReviewTagIdCache) return pendingReviewTagIdCache;
  const existing = await searchRead<{ id: number }>("product.tag", [["name", "=", PENDING_REVIEW_TAG_NAME]], ["id"], { limit: 1 });
  const id = existing[0] ? existing[0].id : await create("product.tag", { name: PENDING_REVIEW_TAG_NAME });
  pendingReviewTagIdCache = id;
  return id;
}

/** يبحث عن منتج مطابق بالاسم (ضمن نفس الفئة إن وُجدت) أو ينشئه — الكتالوج ينمو عضوياً من طلبات العملاء الفعلية.
 * أي منتج جديد يُنشأ (لا يُطابَق) يُعلَّم بوسم "بانتظار مراجعة" — أسماء مستخرجة آلياً بلا مراجعة بشرية قد تتكرر أو تُخطئ، فيحتاج الفريق يراجعها/يدمجها دورياً قبل الاعتماد الكامل عليها بمطابقة الموردين. */
async function findOrCreateCatalogProduct(itemName: string, categoryId: number | null, unit?: string | null): Promise<number> {
  const trimmed = itemName.trim();
  const domain: unknown[] = [["name", "=", trimmed]];
  if (categoryId) domain.push(["categ_id", "=", categoryId]);

  const existing = await searchRead<{ id: number }>("product.product", domain, ["id"], { limit: 1 });
  if (existing[0]) return existing[0].id;

  const uomId = (unit && UNIT_TO_UOM_ID[unit.trim()]) || DEFAULT_UOM_ID;
  const tagId = await getPendingReviewTagId();
  return create("product.product", {
    name: trimmed,
    type: "consu",
    categ_id: categoryId || false,
    uom_id: uomId,
    purchase_ok: true,
    sale_ok: true,
    product_tag_ids: [[6, 0, [tagId]]],
  });
}

/** يضيف بنود مواد مستخلصة آلياً من وصف حر — تُعلَّم بحالة "مستخرج آليًا"/"يحتاج مراجعة" لمراجعة الفريق قبل الاعتماد.
 * productCategoryNameToId: خريطة اسم الفئة → معرّف product.category — إن مرَّرت، يُنشأ/يُطابَق منتج بالكتالوج لكل بند ويُربط بالسطر (x_studio_product_id) */
export async function createExtractedRequestLines(
  requestId: number,
  items: {
    itemName: string;
    originalText: string;
    quantity: number;
    unit?: string | null;
    brand?: string | null;
    countryOfOrigin?: string | null;
    category?: string | null;
    subCategory?: string | null;
    modelNumber?: string | null;
    specifications?: string | null;
    confidence: number;
  }[],
  productCategoryNameToId?: Map<string, number>
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let productId: number | null = null;
    if (productCategoryNameToId) {
      const categoryId = (item.category && productCategoryNameToId.get(item.category)) || null;
      try {
        productId = await findOrCreateCatalogProduct(item.itemName, categoryId, item.unit);
      } catch (error) {
        console.error("[odoo] findOrCreateCatalogProduct failed (non-blocking):", error instanceof Error ? error.message : error);
      }
    }
    await create("x_build_request_line", {
      x_name: item.itemName,
      x_studio_request_id: requestId,
      x_studio_line_number: i + 1,
      x_studio_original_description: item.originalText || item.itemName,
      x_studio_structured_description: item.itemName,
      x_studio_quantity: item.quantity,
      x_studio_uom: item.unit || false,
      x_studio_brand: item.brand || false,
      x_studio_country_of_origin: item.countryOfOrigin || false,
      x_studio_category: item.category || false,
      x_studio_sub_category: item.subCategory || false,
      x_studio_model_number: item.modelNumber || false,
      x_studio_specifications: item.specifications || false,
      x_studio_confidence_score: item.confidence,
      x_studio_line_source: "extracted",
      x_studio_review_status: "needs_review",
      x_studio_product_id: productId || false,
    });
  }
}

export type CustomerLookupResult = {
  contactName: string;
  companyName: string;
  phone: string;
  projects: CustomerProject[];
};

/** يجيب بيانات العميل ومشاريعه النشطة (سجل حقيقي، لا نص مشتق) لتسريع الطلبات التالية */
export async function findCustomerProjectsByEmail(email: string): Promise<CustomerLookupResult | null> {
  const partner = await findPartnerByEmail(email);
  if (!partner) return null;

  const recentRequests = await searchRead<{
    x_studio_contact_name: string | false;
    x_studio_company_name: string | false;
    x_studio_phone: string | false;
  }>(
    "x_build_procurement_request",
    [["x_studio_email", "=", normalizeEmail(email)]],
    ["x_studio_contact_name", "x_studio_company_name", "x_studio_phone"],
    { order: "id desc", limit: 1 }
  );
  if (!recentRequests.length) return null;

  const projectRows = await searchRead<{ id: number; x_name: string }>(
    "x_build_customer_project",
    [["x_studio_customer_id", "=", partner.id], ["x_studio_active_flag", "=", true]],
    ["id", "x_name"],
    { order: "id desc" }
  );

  const latest = recentRequests[0];
  return {
    contactName: latest.x_studio_contact_name || "",
    companyName: latest.x_studio_company_name || "",
    phone: latest.x_studio_phone || "",
    projects: projectRows.map((p) => ({ id: p.id, name: p.x_name })),
  };
}

/** يرفق ملفات (BOQ، مخططات...) بطلب التوريد كمرفقات عادية — بلا أي استخراج/تحليل آلي بهذي المرحلة */
export async function attachProcurementRequestFiles(
  requestId: number,
  files: { name: string; base64Data: string; mimeType: string }[]
): Promise<void> {
  for (const file of files) {
    await createAttachment({
      name: file.name,
      base64Data: file.base64Data,
      mimeType: file.mimeType,
      resModel: "x_build_procurement_request",
      resId: requestId,
    });
  }
}

const GENERATE_TRACKING_ACTION_ID = 929;

/** يستدعي إجراء أودو الجاهز (نفس المنطق المستخدم يدوياً) لتوليد رقم/رمز التتبع بشكل متّسق */
export async function generateProcurementTracking(requestId: number): Promise<{ trackingNumber: string; trackingToken: string }> {
  await executeKw("ir.actions.server", "run", [[GENERATE_TRACKING_ACTION_ID]], {
    context: { active_model: "x_build_procurement_request", active_id: requestId, active_ids: [requestId] },
  });
  const rows = await read<{ x_studio_tracking_number: string | false; x_studio_tracking_token: string | false }>(
    "x_build_procurement_request",
    [requestId],
    ["x_studio_tracking_number", "x_studio_tracking_token"]
  );
  const row = rows[0];
  if (!row?.x_studio_tracking_number || !row.x_studio_tracking_token) {
    throw new OdooClientError({
      message: `Tracking generation did not populate fields for request ${requestId}`,
      kind: "unknown",
      retryable: false,
      correlationId: randomUUID(),
    });
  }
  return { trackingNumber: row.x_studio_tracking_number, trackingToken: row.x_studio_tracking_token };
}

export type ProcurementRequestTrackingView = {
  trackingNumber: string;
  projectName: string;
  customerStatus: string;
  requestDate: string;
  declineReason: string | null;
};

/** عرض العميل عبر التتبع — حقول ظاهرة فقط، لا حالة داخلية ولا بيانات تسعير/موردين */
export async function getProcurementRequestByTrackingToken(token: string): Promise<ProcurementRequestTrackingView | null> {
  const rows = await searchRead<{
    id: number;
    x_studio_tracking_number: string | false;
    x_studio_project_name: string | false;
    x_studio_customer_status: string | false;
    x_studio_request_date: string | false;
    x_studio_decline_reason: string | false;
  }>(
    "x_build_procurement_request",
    [["x_studio_tracking_token", "=", token]],
    ["x_studio_tracking_number", "x_studio_project_name", "x_studio_customer_status", "x_studio_request_date", "x_studio_decline_reason"],
    { limit: 1 }
  );
  const row = rows[0];
  if (!row) return null;
  return {
    trackingNumber: row.x_studio_tracking_number || "",
    projectName: row.x_studio_project_name || "",
    customerStatus: row.x_studio_customer_status || "received",
    requestDate: row.x_studio_request_date || "",
    declineReason: row.x_studio_decline_reason || null,
  };
}

export type PendingDeclineNotification = {
  id: number;
  contactName: string;
  email: string;
  trackingNumber: string;
  declineReason: string | null;
};

/** يبحث عن طلبات وضعها الفريق "مرفوض" داخلياً من واجهة أودو مباشرة، ولم يُشعَر العميل بعد (customer_status لم يُحدَّث بعد) */
export async function getRequestsPendingDeclineNotification(): Promise<PendingDeclineNotification[]> {
  const rows = await searchRead<{
    id: number;
    x_name: string | false;
    x_studio_email: string | false;
    x_studio_tracking_number: string | false;
    x_studio_decline_reason: string | false;
  }>(
    "x_build_procurement_request",
    [
      ["x_studio_internal_status", "=", "rejected"],
      ["x_studio_customer_status", "!=", "declined"],
    ],
    ["x_name", "x_studio_email", "x_studio_tracking_number", "x_studio_decline_reason"]
  );
  return rows
    .filter((row) => row.x_studio_email)
    .map((row) => ({
      id: row.id,
      contactName: row.x_name || "",
      email: row.x_studio_email as string,
      trackingNumber: row.x_studio_tracking_number || "",
      declineReason: row.x_studio_decline_reason || null,
    }));
}

/** يُثبّت الحالة الظاهرة للعميل كـ"معتذر" بعد إنشاء حدث الإشعار — يمنع إعادة الإشعار في الدورة التالية */
export async function markRequestDeclinedForCustomer(requestId: number): Promise<void> {
  await write("x_build_procurement_request", [requestId], { x_studio_customer_status: "declined" });
}

export type ProcurementRequestNotification = {
  id: number;
  contactName: string;
  email: string;
  phone: string;
  projectName: string;
  description: string;
  trackingNumber: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  declineReason: string | null;
};

export async function getProcurementRequestForNotification(requestId: number): Promise<ProcurementRequestNotification | null> {
  const rows = await read<{
    x_studio_email: string | false;
    x_studio_phone: string | false;
    x_studio_project_name: string | false;
    x_studio_request_description: string | false;
    x_studio_tracking_number: string | false;
    x_studio_delivery_latitude: number | false;
    x_studio_delivery_longitude: number | false;
    x_studio_decline_reason: string | false;
    x_name: string | false;
  }>(
    "x_build_procurement_request",
    [requestId],
    [
      "x_studio_email",
      "x_studio_phone",
      "x_studio_project_name",
      "x_studio_request_description",
      "x_studio_tracking_number",
      "x_studio_delivery_latitude",
      "x_studio_delivery_longitude",
      "x_studio_decline_reason",
      "x_name",
    ]
  );
  const row = rows[0];
  if (!row?.x_studio_email) return null;
  return {
    id: requestId,
    contactName: row.x_name || "",
    email: row.x_studio_email,
    phone: row.x_studio_phone || "",
    declineReason: row.x_studio_decline_reason || null,
    projectName: row.x_studio_project_name || "",
    description: row.x_studio_request_description || "",
    trackingNumber: row.x_studio_tracking_number || "",
    deliveryLatitude: row.x_studio_delivery_latitude || null,
    deliveryLongitude: row.x_studio_delivery_longitude || null,
  };
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
  procurementRequestId?: number;
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
    x_studio_procurement_request_id: params.procurementRequestId ?? false,
    x_studio_idempotency_key: params.idempotencyKey,
    x_studio_status: "pending",
    x_studio_attempts: 0,
    x_studio_max_attempts: 5,
    x_studio_payload_json: JSON.stringify(params.payload),
  });
  return { id, created: true };
}
