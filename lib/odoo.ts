import { randomUUID } from "crypto";
import { isEnglishBrandName, normalizeVendorPhone } from "@/lib/vendor-options";
import { convertToSar, normalizeCurrencyCode } from "@/lib/currency";
import { generateSecureTrackingToken } from "@/lib/tracking-token";
import { normalizeCustomerPricing } from "@/lib/financial";
import { claimSubmission, saveSubmissionState } from "@/lib/shared-store";

export { convertToSar, normalizeCurrencyCode } from "@/lib/currency";

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
  businessType:
    | "manufacturer"
    | "authorized_distributor"
    | "distributor"
    | "importer"
    | "exporter"
    | "trader"
    | "service_provider";
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
  contactName: string;
  jobTitle?: string;
  email: string;
  phone: string;
  website?: string;
}): Promise<number> {
  const partnerId = await create("res.partner", {
    name: data.establishmentName,
    is_company: true,
    email: normalizeEmail(data.email),
    phone: normalizeSaudiPhone(data.phone),
    website: data.website || false,
  });
  await ensurePartnerContact(partnerId, data);
  return partnerId;
}

/** يُستخدم عند إعادة استخدام partner موجود (تطابق بريد/جوال بلا ملف مورد/ناقل سابق) — يحدّث اسم المنشأة وis_company بدل إبقاء بيانات جهة الاتصال القديمة التي طابقناها */
export async function syncPartnerAsEstablishment(partnerId: number, establishmentName: string): Promise<void> {
  await write("res.partner", [partnerId], {
    name: establishmentName,
    is_company: true,
  });
}

export async function ensurePartnerContact(
  partnerId: number,
  data: {
    contactName: string;
    jobTitle?: string;
    email: string;
    phone: string;
  }
): Promise<number | null> {
  const contactName = data.contactName.trim();
  if (!contactName) return null;

  const existing = await searchRead<{ id: number }>(
    "res.partner",
    [
      ["parent_id", "=", partnerId],
      ["name", "=ilike", contactName],
    ],
    ["id"],
    { limit: 1 }
  );
  if (existing[0]) return existing[0].id;

  return create("res.partner", {
    parent_id: partnerId,
    type: "contact",
    name: contactName,
    function: data.jobTitle || false,
    email: normalizeEmail(data.email),
    phone: normalizeSaudiPhone(data.phone),
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
    x_studio_business_type: data.businessType,
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
  materialCategoryIds: number[],
  logisticsServiceIds: number[] = []
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
    x_studio_logistics_service_ids: logisticsServiceIds.length ? [[6, 0, logisticsServiceIds]] : false,
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

export async function resolveActiveLogisticsServices(names: string[]): Promise<number[] | null> {
  return resolveExistingActiveLookup("x_build_logistics_service", names);
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
  matchedBrandCount: number;
  score: number;
};

function normalizeLookupName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/** يطابق أسماء العلامات ضد Master Data الموجودة فقط — لا ينشئ علامة جديدة من طلب عميل */
export async function resolveExistingBrandIds(names: string[]): Promise<number[]> {
  const wanted = uniqueNonEmpty(names);
  if (!wanted.length) return [];
  const existing = await searchRead<{ id: number; x_studio_name: string }>("x_build_brand", [], ["x_studio_name"], { limit: 1000 });
  const ids: number[] = [];
  for (const name of wanted) {
    const normalized = normalizeLookupName(name);
    const match = existing.find((r) => normalizeLookupName(r.x_studio_name) === normalized);
    if (match) ids.push(match.id);
  }
  return [...new Set(ids)];
}

/** يبحث عن الموردين المؤهَّلين للمطابقة حسب الفئات والعلامات — العلامة ترفع الأولوية ولا تكون شرطاً وحيداً إلا إذا لم توجد فئات */
export async function findMatchingSuppliers(categoryIds: number[], brandIds: number[] = []): Promise<MatchingSupplier[]> {
  if (!categoryIds.length && !brandIds.length) return [];
  const matchDomain =
    categoryIds.length && brandIds.length
      ? ["|", ["x_studio_material_category_ids", "in", categoryIds], ["x_studio_brand_ids", "in", brandIds]]
      : categoryIds.length
        ? [["x_studio_material_category_ids", "in", categoryIds]]
        : [["x_studio_brand_ids", "in", brandIds]];
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_material_category_ids: number[];
    x_studio_brand_ids: number[];
  }>(
    "x_build_supplier_profile",
    [
      ["x_studio_eligible_for_matching", "=", true],
      ["x_studio_active_flag", "=", true],
      ...matchDomain,
    ],
    ["x_studio_partner_id", "x_studio_material_category_ids", "x_studio_brand_ids"]
  );
  return rows
    .filter((row): row is typeof row & { x_studio_partner_id: [number, string] } => !!row.x_studio_partner_id)
    .map((row) => {
      const matchedCategoryCount = row.x_studio_material_category_ids.filter((id) => categoryIds.includes(id)).length;
      const matchedBrandCount = row.x_studio_brand_ids.filter((id) => brandIds.includes(id)).length;
      return {
        id: row.id,
        partnerId: row.x_studio_partner_id[0],
        name: row.x_studio_partner_id[1],
        matchedCategoryCount,
        matchedBrandCount,
        score: matchedCategoryCount * 10 + matchedBrandCount * 25,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export type MatchingCarrier = {
  id: number;
  partnerId: number;
  name: string;
  matchedCategoryCount: number;
  matchedServiceAreaCount: number;
  score: number;
};

/** يقترح الناقلين المعتمدين حسب فئة المواد ومنطقة الخدمة إن أمكن استنتاجها — requiredLogisticsServiceIds شرط إلزامي إضافي (وليس OR) لاستبعاد ناقل لا يقدّم الخدمة اللازمة فعلياً (مثال: شحن دولي/تخليص جمركي لبند مستورد) */
export async function findMatchingCarriers(
  categoryIds: number[],
  serviceAreaIds: number[] = [],
  requiredLogisticsServiceIds: number[] = []
): Promise<MatchingCarrier[]> {
  const optionalMatch =
    categoryIds.length && serviceAreaIds.length
      ? ["|", ["x_studio_material_category_ids", "in", categoryIds], ["x_studio_service_area_ids", "in", serviceAreaIds]]
      : categoryIds.length
        ? [["x_studio_material_category_ids", "in", categoryIds]]
        : serviceAreaIds.length
          ? [["x_studio_service_area_ids", "in", serviceAreaIds]]
          : [];
  const requiredMatch = requiredLogisticsServiceIds.length ? [["x_studio_logistics_service_ids", "in", requiredLogisticsServiceIds]] : [];
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_material_category_ids: number[];
    x_studio_service_area_ids: number[];
  }>(
    "x_build_carrier_profile",
    [
      ["x_studio_status", "=", "approved"],
      ["x_studio_active_flag", "=", true],
      ...requiredMatch,
      ...optionalMatch,
    ],
    ["x_studio_partner_id", "x_studio_material_category_ids", "x_studio_service_area_ids"]
  );
  return rows
    .filter((row): row is typeof row & { x_studio_partner_id: [number, string] } => !!row.x_studio_partner_id)
    .map((row) => {
      const matchedCategoryCount = row.x_studio_material_category_ids.filter((id) => categoryIds.includes(id)).length;
      const matchedServiceAreaCount = row.x_studio_service_area_ids.filter((id) => serviceAreaIds.includes(id)).length;
      return {
        id: row.id,
        partnerId: row.x_studio_partner_id[0],
        name: row.x_studio_partner_id[1],
        matchedCategoryCount,
        matchedServiceAreaCount,
        score: matchedServiceAreaCount * 20 + matchedCategoryCount * 10,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function escapeOdooHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ensureApprovalCategoryId(name: string, fallbackApproverCategoryName: string): Promise<number | null> {
  const rows = await searchRead<{ id: number; approver_ids: number[] }>("approval.category", [["name", "=", name]], ["approver_ids"], { limit: 1 });
  let categoryId = rows[0]?.id ?? null;

  if (!categoryId) {
    categoryId = await create("approval.category", {
      name,
      has_amount: "no",
      has_partner: "no",
      has_reference: "no",
      has_date: "no",
    });
  }

  const existingApprovers = await searchRead<{ id: number }>("approval.category.approver", [["category_id", "=", categoryId]], ["id"], { limit: 1 });
  if (existingApprovers.length) return categoryId;

  const fallback = await searchRead<{ id: number }>("approval.category", [["name", "=", fallbackApproverCategoryName]], ["id"], { limit: 1 });
  const fallbackId = fallback[0]?.id;
  if (!fallbackId) return categoryId;

  const fallbackApprovers = await searchRead<{ user_id: [number, string] | false; required: boolean }>(
    "approval.category.approver",
    [["category_id", "=", fallbackId]],
    ["user_id", "required"]
  );
  for (const approver of fallbackApprovers) {
    if (!approver.user_id) continue;
    await create("approval.category.approver", {
      category_id: categoryId,
      user_id: approver.user_id[0],
      required: approver.required,
    });
  }

  return categoryId;
}

export async function createBuildAiTask(params: {
  agentName: string;
  requestId: number;
  taskType: string;
  result: string;
  confidenceScore?: number;
  needsApproval?: boolean;
  priority?: "normal" | "urgent" | "critical";
  status?: "pending" | "running" | "completed" | "failed" | "needs_approval";
}): Promise<{ taskId: number; agentId: number } | null> {
  const agents = await searchRead<{ id: number; x_name: string }>(
    "x_build_ai_agent",
    [
      ["x_name", "=", params.agentName],
      ["x_studio_status", "=", "active"],
    ],
    ["id"],
    { limit: 1 }
  );
  const agent = agents[0];
  if (!agent) return null;

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const taskId = await create("x_build_ai_task", {
    x_name: `${params.agentName}: Request #${params.requestId}`,
    x_studio_agent_id: agent.id,
    x_studio_request_id: params.requestId,
    x_studio_task_type: params.taskType,
    x_studio_priority: params.priority || "normal",
    x_studio_status: params.status || (params.needsApproval ? "needs_approval" : "completed"),
    x_studio_needs_approval: params.needsApproval ?? false,
    x_studio_confidence_score: params.confidenceScore ?? false,
    x_studio_result: params.result,
    x_studio_started_at: now,
    x_studio_ended_at: now,
  });
  return { taskId, agentId: agent.id };
}

export async function createAiRecommendationWorkflow(params: {
  agentName: string;
  requestId: number;
  decisionType: "supplier_rfq" | "freight_rfq";
  taskType: string;
  recommendation: string;
  recipientPartnerIds: number[];
  confidenceScore?: number;
}): Promise<{ taskId: number; approvalId: number; approvalRequestId: number | null; communicationIds: number[] } | null> {
  const task = await createBuildAiTask({
    agentName: params.agentName,
    requestId: params.requestId,
    taskType: params.taskType,
    result: params.recommendation,
    confidenceScore: params.confidenceScore,
    needsApproval: true,
    status: "needs_approval",
  });
  if (!task) return null;

  const categoryId =
    params.decisionType === "supplier_rfq"
      ? await ensureApprovalCategoryId("اعتماد إرسال RFQ للموردين", "اختيار المورد الفائز")
      : await ensureApprovalCategoryId("اعتماد إرسال RFQ للشحن", "اختيار الناقل");
  let approvalRequestId: number | null = null;
  if (categoryId) {
    approvalRequestId = await create("approval.request", {
      name: `${params.decisionType === "supplier_rfq" ? "Supplier RFQ" : "Freight RFQ"} approval - Request #${params.requestId}`,
      category_id: categoryId,
      reference: `Build Request #${params.requestId}`,
      x_studio_build_request_id: params.requestId,
      reason: `<p>${escapeOdooHtml(params.recommendation).replace(/\n/g, "<br/>")}</p>`,
    });
    try {
      await callMethod("approval.request", "action_confirm", [[approvalRequestId]]);
    } catch (error) {
      console.error("[odoo] approval.request action_confirm failed (left as draft):", error instanceof Error ? error.message : error);
    }
  }

  const approvalId = await create("x_build_ai_approval", {
    x_name: `${params.decisionType === "supplier_rfq" ? "Supplier RFQ" : "Freight RFQ"} approval - Request #${params.requestId}`,
    x_studio_agent_id: task.agentId,
    x_studio_task_id: task.taskId,
    x_studio_request_id: params.requestId,
    x_studio_decision_type: params.decisionType,
    x_studio_recommendation: params.recommendation,
    x_studio_approval_request_id: approvalRequestId || false,
    x_studio_status: "pending",
  });

  const communicationIds: number[] = [];
  for (const partnerId of params.recipientPartnerIds.slice(0, 10)) {
    communicationIds.push(
      await create("x_build_ai_communication", {
        x_name: `${params.decisionType === "supplier_rfq" ? "Supplier RFQ" : "Freight RFQ"} draft - Request #${params.requestId}`,
        x_studio_request_id: params.requestId,
        x_studio_partner_id: partnerId,
        x_studio_agent_id: task.agentId,
        x_studio_channel: "email",
        x_studio_status: "draft",
        x_studio_reference: `approval:${approvalId}`,
        x_studio_from_address: params.decisionType === "supplier_rfq" ? "supplier@build.sa" : "logistics@build.sa",
        x_studio_rfq_correlation: generateSecureTrackingToken(),
      })
    );
  }

  await write("x_build_procurement_request", [params.requestId], {
    x_studio_internal_status: "awaiting_internal_approval",
  });

  return { taskId: task.taskId, approvalId, approvalRequestId, communicationIds };
}

export type PendingAiApprovalDecision = {
  id: number;
  requestId: number;
  taskId: number;
  agentId: number;
  decisionType: "supplier_rfq" | "freight_rfq";
  approvalRequestId: number;
  approvalStatus: "approved" | "refused";
};

export async function getPendingAiApprovalDecisions(): Promise<PendingAiApprovalDecision[]> {
  const rows = await searchRead<{
    id: number;
    x_studio_decision_type: string | false;
    x_studio_request_id: [number, string] | false;
    x_studio_task_id: [number, string] | false;
    x_studio_agent_id: [number, string] | false;
    x_studio_approval_request_id: [number, string] | false;
  }>(
    "x_build_ai_approval",
    [
      ["x_studio_status", "=", "pending"],
      ["x_studio_approval_request_id", "!=", false],
    ],
    ["x_studio_decision_type", "x_studio_request_id", "x_studio_task_id", "x_studio_agent_id", "x_studio_approval_request_id"],
    { limit: 50, order: "id asc" }
  );

  const approvalIds = rows.map((row) => row.x_studio_approval_request_id && row.x_studio_approval_request_id[0]).filter((id): id is number => typeof id === "number");
  if (!approvalIds.length) return [];
  const approvalRows = await read<{ id: number; request_status: string | false }>("approval.request", approvalIds, ["request_status"]);
  const statusById = new Map(approvalRows.map((row) => [row.id, row.request_status]));

  return rows
    .map((row) => {
      const approvalRequestId = row.x_studio_approval_request_id && row.x_studio_approval_request_id[0];
      const status = typeof approvalRequestId === "number" ? statusById.get(approvalRequestId) : null;
      if (status !== "approved" && status !== "refused") return null;
      if (row.x_studio_decision_type !== "supplier_rfq" && row.x_studio_decision_type !== "freight_rfq") return null;
      if (!row.x_studio_request_id || !row.x_studio_task_id || !row.x_studio_agent_id || typeof approvalRequestId !== "number") return null;
      return {
        id: row.id,
        requestId: row.x_studio_request_id[0],
        taskId: row.x_studio_task_id[0],
        agentId: row.x_studio_agent_id[0],
        decisionType: row.x_studio_decision_type,
        approvalRequestId,
        approvalStatus: status,
      };
    })
    .filter((row): row is PendingAiApprovalDecision => !!row);
}

export type AiCommunicationDraft = {
  id: number;
  partnerId: number;
  correlation: string;
};

export async function getDraftAiCommunications(requestId: number, agentId: number): Promise<AiCommunicationDraft[]> {
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_rfq_correlation: string | false;
  }>(
    "x_build_ai_communication",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_agent_id", "=", agentId],
      ["x_studio_status", "=", "draft"],
    ],
    ["x_studio_partner_id", "x_studio_rfq_correlation"],
    { limit: 50, order: "id asc" }
  );
  return rows
    .filter((row): row is typeof row & { x_studio_partner_id: [number, string] } => !!row.x_studio_partner_id)
    .map((row) => ({ id: row.id, partnerId: row.x_studio_partner_id[0], correlation: row.x_studio_rfq_correlation || "" }));
}

export async function findSentCommunicationByCorrelation(correlation: string, email: string): Promise<{ requestId: number; partnerId: number; communicationId: number; quoteType: "supplier" | "freight" } | null> {
  const comms = await searchRead<{ id: number; x_name: string | false; x_studio_request_id: [number, string] | false; x_studio_partner_id: [number, string] | false }>(
    "x_build_ai_communication",
    [["x_studio_rfq_correlation", "=", correlation], ["x_studio_status", "=", "sent"]],
    ["x_name", "x_studio_request_id", "x_studio_partner_id"], { limit: 2 }
  );
  const comm = comms[0];
  if (!comm?.x_studio_request_id || !comm.x_studio_partner_id) return null;
  const partners = await searchRead<{ id: number }>("res.partner", [["id", "=", comm.x_studio_partner_id[0]], ["email", "=ilike", normalizeEmail(email)]], ["id"], { limit: 1 });
  if (!partners.length) return null;
  return { requestId: comm.x_studio_request_id[0], partnerId: comm.x_studio_partner_id[0], communicationId: comm.id, quoteType: typeof comm.x_name === "string" && comm.x_name.startsWith("Freight") ? "freight" : "supplier" };
}

export async function markAiCommunicationSent(communicationId: number, messageId?: string): Promise<void> {
  await write("x_build_ai_communication", [communicationId], {
    x_studio_status: "sent",
    x_studio_sent_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    x_studio_message_id: messageId || false,
  });
}

export async function markAiApprovalApproved(decision: PendingAiApprovalDecision): Promise<void> {
  await write("x_build_ai_approval", [decision.id], { x_studio_status: "approved" });
  await write("x_build_ai_task", [decision.taskId], {
    x_studio_status: "completed",
    x_studio_needs_approval: false,
  });
  await write("x_build_procurement_request", [decision.requestId], {
    x_studio_internal_status: decision.decisionType === "supplier_rfq" ? "requesting_supplier_quotes" : "requesting_freight_quotes",
    x_studio_customer_status: "pricing",
  });
}

export async function markAiApprovalRejected(decision: PendingAiApprovalDecision): Promise<void> {
  await write("x_build_ai_approval", [decision.id], { x_studio_status: "rejected" });
  await write("x_build_ai_task", [decision.taskId], {
    x_studio_status: "failed",
    x_studio_needs_approval: false,
    x_studio_error: "Approval request was refused",
  });
}

export type PartnerRfqRecipient = {
  id: number;
  name: string;
  email: string;
};

export async function getPartnerRfqRecipient(partnerId: number): Promise<PartnerRfqRecipient | null> {
  const rows = await read<{ name: string | false; email: string | false }>("res.partner", [partnerId], ["name", "email"]);
  const row = rows[0];
  if (!row?.email) return null;
  return { id: partnerId, name: row.name || "", email: row.email };
}

export type ProcurementRfqLine = {
  itemName: string;
  quantity: number;
  unit: string;
  brand: string;
  countryOfOrigin: string;
};

export type ProcurementRfqDetails = ProcurementRequestNotification & {
  lines: ProcurementRfqLine[];
};

export async function getProcurementRfqDetails(requestId: number): Promise<ProcurementRfqDetails | null> {
  const request = await getProcurementRequestForNotification(requestId);
  if (!request) return null;
  const lines = await searchRead<{
    x_studio_structured_description: string | false;
    x_studio_original_description: string | false;
    x_studio_quantity: number | false;
    x_studio_uom: string | false;
    x_studio_brand: string | false;
    x_studio_country_of_origin: string | false;
  }>(
    "x_build_request_line",
    [["x_studio_request_id", "=", requestId]],
    ["x_studio_structured_description", "x_studio_original_description", "x_studio_quantity", "x_studio_uom", "x_studio_brand", "x_studio_country_of_origin"],
    { limit: 100, order: "x_studio_line_number asc, id asc" }
  );
  return {
    ...request,
    lines: lines.map((line) => ({
      itemName: line.x_studio_structured_description || line.x_studio_original_description || "",
      quantity: line.x_studio_quantity || 0,
      unit: line.x_studio_uom || "",
      brand: line.x_studio_brand || "",
      countryOfOrigin: line.x_studio_country_of_origin || "",
    })),
  };
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
  projectId: number,
  submissionKey?: string
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
    // Created by the remediation migration. This is the durable reconciliation key for a website submission.
    x_studio_submission_key: submissionKey || false,
  });
}

export async function findProcurementRequestBySubmissionKey(submissionKey: string): Promise<{ id: number; trackingNumber: string | null; trackingToken: string | null } | null> {
  const rows = await searchRead<{ id: number; x_studio_tracking_number: string | false; x_studio_tracking_token: string | false }>(
    "x_build_procurement_request",
    [["x_studio_submission_key", "=", submissionKey]],
    ["x_studio_tracking_number", "x_studio_tracking_token"],
    { limit: 2, order: "id asc" }
  );
  if (rows.length > 1) throw new OdooClientError({ message: `Duplicate submission key ${submissionKey}`, kind: "conflict", retryable: false, correlationId: randomUUID() });
  const row = rows[0];
  return row ? { id: row.id, trackingNumber: row.x_studio_tracking_number || null, trackingToken: row.x_studio_tracking_token || null } : null;
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
      x_studio_brand: item.brand && isEnglishBrandName(item.brand) ? item.brand : false,
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
      x_studio_brand: item.brand && isEnglishBrandName(item.brand) ? item.brand : false,
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
  // لا نعتمد على token الحتمي في Server Action (مشتق من sequence + record.id).
  // نضع bearer secret عشوائياً أولاً؛ الإجراء يحافظ على القيمة الموجودة ويولّد رقم التتبع فقط.
  await write("x_build_procurement_request", [requestId], {
    x_studio_tracking_token: generateSecureTrackingToken(),
  });
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
  const claimKey = `outbox:${params.idempotencyKey}`;
  const claimInitial = { status: "processing" as const, submissionId: params.idempotencyKey, correlationId: randomUUID(), stage: "creating_outbox" };
  const claim = await claimSubmission(claimKey, claimInitial);
  if (!claim.claimed) {
    if (claim.state.status === "completed" && claim.state.requestId) return { id: claim.state.requestId, created: false };
    // A timeout after Odoo commits must be reconciled by the durable event key, not
    // blindly retried into a second side effect.
    throw new Error(`Outbox event ${params.idempotencyKey} is already ${claim.state.status}; reconciliation required`);
  }
  try {
  const existing = await searchRead<{ id: number }>(
    "x_build_integration_outbox",
    [["x_studio_idempotency_key", "=", params.idempotencyKey]],
    ["id"],
    { limit: 1 }
  );
  if (existing[0]) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "completed", requestId: existing[0].id, stage: "existing_outbox" });
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
  await saveSubmissionState(claimKey, { ...claimInitial, status: "completed", requestId: id, stage: "outbox_created" });
  return { id, created: true };
  } catch (error) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "failed", stage: "outbox_failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) }).catch(() => undefined);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// 2B: استقبال عروض أسعار الموردين/الناقلين (رد على RFQ)
// ─────────────────────────────────────────────────────────────

export async function findRequestIdByTrackingNumber(trackingNumber: string): Promise<number | null> {
  const rows = await searchRead<{ id: number }>(
    "x_build_procurement_request",
    [["x_studio_tracking_number", "=", trackingNumber]],
    ["id"],
    { limit: 1 }
  );
  return rows[0]?.id ?? null;
}

/** يبحث عن اتصال RFQ الذي أُرسل فعلياً (sent) لهذا الطلب وهذا المورد/الناقل — يُستخدم لربط الرد الوارد بمرجع RFQ الصحيح */
export async function findSentCommunicationForPartner(requestId: number, partnerId: number): Promise<number | null> {
  const rows = await searchRead<{ id: number }>(
    "x_build_ai_communication",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_partner_id", "=", partnerId],
      ["x_studio_status", "=", "sent"],
    ],
    ["id"],
    { limit: 1, order: "id desc" }
  );
  return rows[0]?.id ?? null;
}

/** يبحث عن partnerId عبر بريده الإلكتروني — للتحقق أن مُرسل الرد هو فعلاً المورد/الناقل المطلوب */
export async function findPartnerIdByEmailAndRequest(email: string, requestId: number): Promise<number | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const comms = await searchRead<{ id: number; x_studio_partner_id: [number, string] | false }>(
    "x_build_ai_communication",
    [
      ["x_studio_request_id", "=", requestId],
      // لا يكفي أن يكون المورد ضمن recommendation/draft؛ لا نقبل رده إلا بعد اعتماد RFQ وإرساله فعلياً.
      ["x_studio_status", "=", "sent"],
    ],
    ["x_studio_partner_id"]
  );
  const partnerIds = comms.map((c) => c.x_studio_partner_id && c.x_studio_partner_id[0]).filter((id): id is number => typeof id === "number");
  if (!partnerIds.length) return null;
  const partners = await searchRead<{ id: number; email: string | false }>(
    "res.partner",
    [["id", "in", partnerIds], ["email", "=ilike", normalized]],
    ["id"],
    { limit: 1 }
  );
  return partners[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────
// Currency — Odoo res.currency هو مصدر الحقيقة الوحيد لأسعار الصرف (لا سعر صرف مثبّت في الكود)
// ─────────────────────────────────────────────────────────────

/**
 * أسعار صرف Odoo مقابل عملة الشركة (SAR). دلالة Odoo: rate = عدد وحدات العملة مقابل 1 SAR،
 * فالتحويل لSAR = المبلغ ÷ rate. يرجع خريطة code→rate للعملات النشطة فقط (SAR=1 دائماً).
 */
export async function getCurrencyRatesToSar(codes: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>([["SAR", 1]]);
  const needed = [...new Set(codes.map((c) => c.toUpperCase()))].filter((c) => c && c !== "SAR");
  if (!needed.length) return map;
  const rows = await searchRead<{ name: string; rate: number }>(
    "res.currency",
    [["name", "in", needed], ["active", "=", true]],
    ["name", "rate"]
  );
  for (const row of rows) {
    if (typeof row.rate === "number" && row.rate > 0) map.set(row.name.toUpperCase(), row.rate);
  }
  return map;
}

export type FxSnapshot = { currency: string; rate: number; rateDate: string; snapshotAt: string; source: "odoo.res.currency.rate"; amountSar: number };

/** Reads the effective Odoo rate once and returns immutable metadata to persist with the quote. */
export async function snapshotToSar(amount: number, currency: string): Promise<FxSnapshot | null> {
  const snapshotAt = new Date().toISOString();
  const today = snapshotAt.slice(0, 10);
  if (currency === "SAR") return { currency: "SAR", rate: 1, rateDate: today, snapshotAt, source: "odoo.res.currency.rate", amountSar: Math.round(amount * 100) / 100 };
  const rows = await searchRead<{ name: string; rate: number; currency_id: [number, string] | false }>(
    "res.currency.rate",
    [["currency_id.name", "=", currency], ["name", "<=", today]],
    ["name", "rate", "currency_id"],
    { limit: 1, order: "name desc" }
  );
  const row = rows[0];
  if (!row || typeof row.rate !== "number" || row.rate <= 0) return null;
  const maxAgeDays = Number(process.env.MAX_FX_RATE_AGE_DAYS ?? 2);
  const ageMs = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${row.name}T00:00:00Z`);
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0 || !Number.isFinite(ageMs) || ageMs > maxAgeDays * 86_400_000) return null;
  const amountSar = convertToSar(amount, currency, new Map([[currency, row.rate]]));
  return amountSar === null ? null : { currency, rate: row.rate, rateDate: row.name, snapshotAt, source: "odoo.res.currency.rate", amountSar };
}

async function replaceSupplierQuoteLines(
  quoteId: number,
  lines: { itemName: string; unitPrice?: number | null; quantity?: number | null; available?: boolean | null; notes?: string | null }[]
): Promise<void> {
  const existing = await searchRead<{ id: number }>("x_build_supplier_quote_line", [["x_studio_quote_id", "=", quoteId]], ["id"]);
  if (existing.length) {
    await callMethod("x_build_supplier_quote_line", "unlink", [existing.map((r) => r.id)]);
  }
  for (const line of lines) {
    await create("x_build_supplier_quote_line", {
      x_name: line.itemName,
      x_studio_quote_id: quoteId,
      x_studio_item_name: line.itemName,
      x_studio_unit_price: line.unitPrice ?? false,
      x_studio_quantity: line.quantity ?? false,
      x_studio_available: line.available ?? true,
      x_studio_notes: line.notes || false,
    });
  }
}

/**
 * يسجّل رد مورد/ناقل كعرض سعر منظَّم في Odoo.
 * - العملة: تُوحَّد لرمز ISO؛ وإن كانت غير SAR وبلا سعر صرف نشط في Odoo، يُجبَر العرض على needs_review (لا يُسعَّر آلياً برقم خاطئ).
 * - منع التكرار (F2): عرض واحد لكل (طلب + مورد + نوع). ردّ مكرّر/إعادة تسليم webhook تُحدّث العرض القائم بدل إنشاء عرض ثانٍ.
 */
export async function createSupplierQuote(params: {
  requestId: number;
  partnerId: number;
  communicationId: number | null;
  quoteType: "supplier" | "freight";
  rawReplyText: string;
  extraction: {
    totalPrice?: number | null;
    currency?: string | null;
    leadTimeDays?: number | null;
    validityDays?: number | null;
    paymentTerms?: string | null;
    includesDelivery?: boolean | null;
    includesTax?: boolean | null;
    confidence: number;
    lines: { itemName: string; unitPrice?: number | null; quantity?: number | null; available?: boolean | null; notes?: string | null }[];
  };
}): Promise<number> {
  // A missing or unrecognized currency is a financial exception, never an implicit SAR value.
  const currencyCode = normalizeCurrencyCode(params.extraction.currency) || "UNKNOWN";

  // إن كان هناك سعر بعملة غير SAR، تأكّد من توفّر سعر صرف نشط في Odoo قبل السماح بالتسعير الآلي
  let snapshot: FxSnapshot | null = null;
  let currencyConvertible = true;
  if (params.extraction.totalPrice != null && currencyCode !== "SAR") {
    snapshot = await snapshotToSar(params.extraction.totalPrice, currencyCode);
    currencyConvertible = snapshot !== null;
  } else if (params.extraction.totalPrice != null && currencyCode === "SAR") {
    snapshot = await snapshotToSar(params.extraction.totalPrice, currencyCode);
  }
  // عرض بعملة لا يمكن تحويلها بأمان لا يجوز أن يدخل المقارنة/التسعير الآلي — يُحوَّل للمراجعة اليدوية
  const status = !currencyConvertible ? "needs_review" : params.extraction.confidence >= 0.5 ? "analyzed" : "needs_review";
  const taxState = params.extraction.includesTax === true ? "included" : params.extraction.includesTax === false ? "excluded" : "unknown";
  const deliveryState = params.extraction.includesDelivery === true ? "included" : params.extraction.includesDelivery === false ? "excluded" : "unknown";

  const fields = {
    x_name: `Quote — Request #${params.requestId} — Partner #${params.partnerId}`,
    x_studio_request_id: params.requestId,
    x_studio_partner_id: params.partnerId,
    x_studio_communication_id: params.communicationId ?? false,
    x_studio_quote_type: params.quoteType,
    x_studio_status: status,
    x_studio_total_price: params.extraction.totalPrice ?? false,
    x_studio_currency: currencyCode,
    x_studio_fx_rate: snapshot?.rate ?? false,
    x_studio_fx_rate_date: snapshot?.rateDate ?? false,
    x_studio_fx_snapshot_at: snapshot?.snapshotAt?.slice(0, 19).replace("T", " ") ?? false,
    x_studio_fx_source: snapshot?.source ?? false,
    x_studio_total_price_sar: snapshot?.amountSar ?? false,
    x_studio_lead_time_days: params.extraction.leadTimeDays ?? false,
    x_studio_validity_days: params.extraction.validityDays ?? false,
    x_studio_payment_terms: params.extraction.paymentTerms || false,
    x_studio_includes_delivery: params.extraction.includesDelivery ?? false,
    x_studio_includes_tax: params.extraction.includesTax ?? false,
    x_studio_tax_inclusion_state: taxState,
    x_studio_delivery_inclusion_state: deliveryState,
    x_studio_raw_reply_text: params.rawReplyText,
    x_studio_confidence_score: params.extraction.confidence,
    x_studio_received_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  // منع التكرار: عرض قائم لنفس (الطلب + المورد + النوع) يُحدَّث ويُعاد استخدامه بدل إنشاء عرض جديد
  const existing = await searchRead<{ id: number }>(
    "x_build_supplier_quote",
    [
      ["x_studio_request_id", "=", params.requestId],
      ["x_studio_partner_id", "=", params.partnerId],
      ["x_studio_quote_type", "=", params.quoteType],
    ],
    ["id"],
    { limit: 1, order: "id asc" }
  );

  let quoteId: number;
  if (existing[0]) {
    quoteId = existing[0].id;
    // لا نعيد كتابة is_winner إن سبق اعتماد فائز — نحدّث بيانات العرض فقط
    await write("x_build_supplier_quote", [quoteId], fields);
    await replaceSupplierQuoteLines(quoteId, params.extraction.lines);
  } else {
    quoteId = await create("x_build_supplier_quote", fields);
    for (const line of params.extraction.lines) {
      await create("x_build_supplier_quote_line", {
        x_name: line.itemName,
        x_studio_quote_id: quoteId,
        x_studio_item_name: line.itemName,
        x_studio_unit_price: line.unitPrice ?? false,
        x_studio_quantity: line.quantity ?? false,
        x_studio_available: line.available ?? true,
        x_studio_notes: line.notes || false,
      });
    }
  }

  if (params.communicationId) {
    await write("x_build_ai_communication", [params.communicationId], {
      x_studio_replied_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  }

  return quoteId;
}

// ─────────────────────────────────────────────────────────────
// 2C: مقارنة عروض الأسعار واختيار الفائز
// ─────────────────────────────────────────────────────────────

type QuoteForComparison = {
  id: number;
  partnerId: number;
  partnerName: string;
  totalPrice: number | null;
  currency: string;
  /** السعر بعد التحويل لSAR بأسعار Odoo — أساس المقارنة والترتيب. null إن تعذّر التحويل */
  totalPriceSar: number | null;
  leadTimeDays: number | null;
  validityDays: number | null;
  paymentTerms: string | null;
};

async function getAnalyzedQuotesForComparison(requestId: number, quoteType: "supplier" | "freight"): Promise<QuoteForComparison[]> {
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_total_price: number | false;
    x_studio_currency: string | false;
    x_studio_total_price_sar: number | false;
    x_studio_lead_time_days: number | false;
    x_studio_validity_days: number | false;
    x_studio_payment_terms: string | false;
  }>(
    "x_build_supplier_quote",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_quote_type", "=", quoteType],
      ["x_studio_status", "=", "analyzed"],
    ],
    ["x_studio_partner_id", "x_studio_total_price", "x_studio_currency", "x_studio_total_price_sar", "x_studio_lead_time_days", "x_studio_validity_days", "x_studio_payment_terms"]
  );
  const withPartner = rows.filter((row): row is typeof row & { x_studio_partner_id: [number, string] } => !!row.x_studio_partner_id);

  return withPartner.map((row) => {
    const totalPrice = row.x_studio_total_price === false ? null : row.x_studio_total_price;
    const currency = normalizeCurrencyCode(row.x_studio_currency || null) || "UNKNOWN";
    // A decision must be reproducible. Never re-price a received quote using today's rate.
    const totalPriceSar = row.x_studio_total_price_sar === false ? null : row.x_studio_total_price_sar;
    return {
      id: row.id,
      partnerId: row.x_studio_partner_id[0],
      partnerName: row.x_studio_partner_id[1],
      totalPrice,
      currency,
      totalPriceSar,
      leadTimeDays: row.x_studio_lead_time_days === false ? null : row.x_studio_lead_time_days,
      validityDays: row.x_studio_validity_days === false ? null : row.x_studio_validity_days,
      paymentTerms: row.x_studio_payment_terms || null,
    };
  });
}

/** ترتيب العروض بالسعر بعد التحويل لSAR (الأقل أولاً)؛ العروض بلا سعر قابل للتحويل تُدفَع لآخر الترتيب، ثم مدة التجهيز الأقل كفاصل */
function rankQuotes(quotes: QuoteForComparison[]): QuoteForComparison[] {
  return [...quotes].sort((a, b) => {
    if (a.totalPriceSar === null && b.totalPriceSar === null) return 0;
    if (a.totalPriceSar === null) return 1;
    if (b.totalPriceSar === null) return -1;
    if (a.totalPriceSar !== b.totalPriceSar) return a.totalPriceSar - b.totalPriceSar;
    return (a.leadTimeDays ?? Infinity) - (b.leadTimeDays ?? Infinity);
  });
}

function formatQuoteComparisonLine(quote: QuoteForComparison, rank: number): string {
  // نعرض السعر الأصلي بعملته، ونضيف المقابل بالـSAR عند اختلاف العملة لشفافية أساس المقارنة
  const priceLabel =
    quote.totalPrice === null
      ? "سعر غير محدد"
      : quote.currency === "SAR"
        ? `${quote.totalPrice} SAR`
        : quote.totalPriceSar !== null
          ? `${quote.totalPrice} ${quote.currency} (= ${quote.totalPriceSar} SAR)`
          : `${quote.totalPrice} ${quote.currency} (تعذّر التحويل لSAR)`;
  const parts = [
    priceLabel,
    quote.leadTimeDays !== null ? `تجهيز ${quote.leadTimeDays} يوم` : null,
    quote.validityDays !== null ? `صلاحية ${quote.validityDays} يوم` : null,
    quote.paymentTerms || null,
  ].filter(Boolean);
  return `${rank}. ${quote.partnerName} — ${parts.join(" | ")}`;
}

const WINNER_DECISION_TYPE: Record<"supplier" | "freight", string> = {
  supplier: "supplier_winner",
  freight: "freight_winner",
};
const WINNER_CATEGORY_NAME: Record<"supplier" | "freight", string> = {
  supplier: "اختيار المورد الفائز",
  freight: "اختيار الناقل",
};
const WINNER_AGENT_NAME: Record<"supplier" | "freight", string> = {
  supplier: "Supplier Quote Analysis Agent",
  freight: "Freight Quote Analysis Agent",
};

/** يفحص إن كان فيه عرضان محلَّلان (analyzed) أو أكثر لنفس الطلب/النوع، ولا يوجد قرار اختيار فائز سابق له بعد — ينشئ مقارنة + AI Task + Approval + approval.request حقيقي (بوابة بشرية) لاعتماد الفائز. لا يكرر الإنشاء لو سبق أن أُنشئ قرار لنفس الطلب/النوع */
export async function checkAndTriggerWinnerSelection(requestId: number, quoteType: "supplier" | "freight"): Promise<void> {
  const quotes = await getAnalyzedQuotesForComparison(requestId, quoteType);
  if (quotes.length < 2) return;

  const claimKey = `winner-selection:${requestId}:${quoteType}`;
  const claimInitial = { status: "processing" as const, submissionId: claimKey, correlationId: randomUUID(), stage: "creating_winner_selection" };
  const claim = await claimSubmission(claimKey, claimInitial);
  if (!claim.claimed) return;
  try {
  const existingDecision = await searchRead<{ id: number }>(
    "x_build_ai_approval",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_decision_type", "=", WINNER_DECISION_TYPE[quoteType]],
    ],
    ["id"],
    { limit: 1 }
  );
  if (existingDecision.length) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "completed", requestId: existingDecision[0].id, stage: "existing_winner_selection" });
    return;
  }

  const ranked = rankQuotes(quotes);
  const comparisonText = `مقارنة عروض ${quoteType === "supplier" ? "الموردين" : "الشحن"} للطلب #${requestId} (الأفضل أولاً):\n${ranked
    .map((q, i) => formatQuoteComparisonLine(q, i + 1))
    .join("\n")}`;

  const task = await createBuildAiTask({
    agentName: WINNER_AGENT_NAME[quoteType],
    requestId,
    taskType: quoteType === "supplier" ? "supplier_quote_comparison" : "freight_quote_comparison",
    result: comparisonText,
    needsApproval: true,
    status: "needs_approval",
  });
  if (!task) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "failed", stage: "task_not_created" });
    return;
  }

  const categoryName = WINNER_CATEGORY_NAME[quoteType];
  const categoryId = await ensureApprovalCategoryId(categoryName, categoryName);
  let approvalRequestId: number | null = null;
  if (categoryId) {
    approvalRequestId = await create("approval.request", {
      name: `${categoryName} - Request #${requestId}`,
      category_id: categoryId,
      reference: `Build Request #${requestId}`,
      x_studio_build_request_id: requestId,
      reason: `<p>${escapeOdooHtml(comparisonText).replace(/\n/g, "<br/>")}</p>`,
    });
    try {
      await callMethod("approval.request", "action_confirm", [[approvalRequestId]]);
    } catch (error) {
      console.error("[odoo] winner-selection approval.request action_confirm failed (left as draft):", error instanceof Error ? error.message : error);
    }
  }

  const decisionId = await create("x_build_ai_approval", {
    x_name: `${categoryName} - Request #${requestId}`,
    x_studio_agent_id: task.agentId,
    x_studio_task_id: task.taskId,
    x_studio_request_id: requestId,
    x_studio_decision_type: WINNER_DECISION_TYPE[quoteType],
    x_studio_recommendation: comparisonText,
    x_studio_approval_request_id: approvalRequestId || false,
    x_studio_status: "pending",
  });

  await write("x_build_procurement_request", [requestId], { x_studio_internal_status: "comparing" });
  await saveSubmissionState(claimKey, { ...claimInitial, status: "completed", requestId: decisionId, stage: "winner_selection_created" });
  } catch (error) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "failed", stage: "winner_selection_failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) }).catch(() => undefined);
    throw error;
  }
}

export type PendingWinnerSelectionDecision = {
  id: number;
  requestId: number;
  taskId: number;
  quoteType: "supplier" | "freight";
  approvalRequestId: number;
  approvalStatus: "approved" | "refused";
};

export async function getPendingWinnerSelectionDecisions(): Promise<PendingWinnerSelectionDecision[]> {
  const rows = await searchRead<{
    id: number;
    x_studio_decision_type: string | false;
    x_studio_request_id: [number, string] | false;
    x_studio_task_id: [number, string] | false;
    x_studio_approval_request_id: [number, string] | false;
  }>(
    "x_build_ai_approval",
    [
      ["x_studio_status", "=", "pending"],
      ["x_studio_decision_type", "in", ["supplier_winner", "freight_winner"]],
      ["x_studio_approval_request_id", "!=", false],
    ],
    ["x_studio_decision_type", "x_studio_request_id", "x_studio_task_id", "x_studio_approval_request_id"],
    { limit: 50, order: "id asc" }
  );

  const approvalIds = rows.map((row) => row.x_studio_approval_request_id && row.x_studio_approval_request_id[0]).filter((id): id is number => typeof id === "number");
  if (!approvalIds.length) return [];
  const approvalRows = await read<{ id: number; request_status: string | false }>("approval.request", approvalIds, ["request_status"]);
  const statusById = new Map(approvalRows.map((row) => [row.id, row.request_status]));

  return rows
    .map((row) => {
      const approvalRequestId = row.x_studio_approval_request_id && row.x_studio_approval_request_id[0];
      const status = typeof approvalRequestId === "number" ? statusById.get(approvalRequestId) : null;
      if (status !== "approved" && status !== "refused") return null;
      if (!row.x_studio_request_id || !row.x_studio_task_id || typeof approvalRequestId !== "number") return null;
      const quoteType = row.x_studio_decision_type === "supplier_winner" ? "supplier" : "freight";
      return {
        id: row.id,
        requestId: row.x_studio_request_id[0],
        taskId: row.x_studio_task_id[0],
        quoteType,
        approvalRequestId,
        approvalStatus: status,
      } as PendingWinnerSelectionDecision;
    })
    .filter((row): row is PendingWinnerSelectionDecision => !!row);
}

export async function markWinnerSelectionApproved(decision: PendingWinnerSelectionDecision): Promise<{ winnerQuoteId: number | null; winnerPartnerName: string | null }> {
  const quotes = await getAnalyzedQuotesForComparison(decision.requestId, decision.quoteType);
  const ranked = rankQuotes(quotes);
  const winner = ranked[0] ?? null;

  if (winner) {
    await write("x_build_supplier_quote", [winner.id], { x_studio_is_winner: true });
    const others = ranked.slice(1).map((q) => q.id);
    if (others.length) await write("x_build_supplier_quote", others, { x_studio_is_winner: false });
  }

  await write("x_build_ai_approval", [decision.id], { x_studio_status: "approved" });
  await write("x_build_ai_task", [decision.taskId], { x_studio_status: "completed", x_studio_needs_approval: false });

  if (winner) {
    const note = `تم اعتماد ${decision.quoteType === "supplier" ? "المورد" : "الناقل"} الفائز: ${winner.partnerName}${
      winner.totalPrice !== null ? ` (${winner.totalPrice} ${winner.currency})` : ""
    }`;
    await postProcurementRequestNote(decision.requestId, note);
  }

  return { winnerQuoteId: winner?.id ?? null, winnerPartnerName: winner?.partnerName ?? null };
}

export async function markWinnerSelectionRejected(decision: PendingWinnerSelectionDecision): Promise<void> {
  await write("x_build_ai_approval", [decision.id], { x_studio_status: "rejected" });
  await write("x_build_ai_task", [decision.taskId], {
    x_studio_status: "failed",
    x_studio_needs_approval: false,
    x_studio_error: "Winner selection approval was refused",
  });
}

// ─────────────────────────────────────────────────────────────
// 2D: عرض السعر للعميل (بعد اعتماد الفائزين)
// ─────────────────────────────────────────────────────────────

const CUSTOMER_OFFER_DECISION_TYPE = "customer_offer";
const CUSTOMER_OFFER_CATEGORY_NAME = "إرسال عرض العميل";
const CUSTOMER_OFFER_AGENT_NAME = "Follow-up Agent";
const DEFAULT_CUSTOMER_MARKUP_PCT = 15;

type WinnerQuote = {
  id: number;
  partnerName: string;
  totalPrice: number | null;
  currency: string;
  /** السعر بعد التحويل لSAR — أساس كل الحسابات المالية. null إن تعذّر التحويل */
  totalPriceSar: number | null;
  leadTimeDays: number | null;
  validityDays: number | null;
  includesDelivery: boolean;
  includesTax: boolean;
  fxRate: number | null;
  fxRateDate: string | null;
  fxSnapshotAt: string | null;
  taxState: "included" | "excluded" | "unknown";
  deliveryState: "included" | "excluded" | "unknown";
};

async function getWinnerQuote(requestId: number, quoteType: "supplier" | "freight"): Promise<WinnerQuote | null> {
  const rows = await searchRead<{
    id: number;
    x_studio_partner_id: [number, string] | false;
    x_studio_total_price: number | false;
    x_studio_currency: string | false;
    x_studio_total_price_sar: number | false;
    x_studio_fx_rate: number | false;
    x_studio_fx_rate_date: string | false;
    x_studio_fx_snapshot_at: string | false;
    x_studio_tax_inclusion_state: "included" | "excluded" | "unknown" | false;
    x_studio_delivery_inclusion_state: "included" | "excluded" | "unknown" | false;
    x_studio_lead_time_days: number | false;
    x_studio_validity_days: number | false;
    x_studio_includes_delivery: boolean;
    x_studio_includes_tax: boolean;
  }>(
    "x_build_supplier_quote",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_quote_type", "=", quoteType],
      ["x_studio_is_winner", "=", true],
    ],
    ["x_studio_partner_id", "x_studio_total_price", "x_studio_currency", "x_studio_total_price_sar", "x_studio_fx_rate", "x_studio_fx_rate_date", "x_studio_fx_snapshot_at", "x_studio_tax_inclusion_state", "x_studio_delivery_inclusion_state", "x_studio_lead_time_days", "x_studio_validity_days", "x_studio_includes_delivery", "x_studio_includes_tax"],
    { limit: 1, order: "id desc" }
  );
  const row = rows[0];
  if (!row) return null;
  const totalPrice = row.x_studio_total_price === false ? null : row.x_studio_total_price;
  const currency = normalizeCurrencyCode(row.x_studio_currency || null) || "UNKNOWN";
  return {
    id: row.id,
    partnerName: row.x_studio_partner_id ? row.x_studio_partner_id[1] : "-",
    totalPrice,
    currency,
    totalPriceSar: row.x_studio_total_price_sar === false ? null : row.x_studio_total_price_sar,
    leadTimeDays: row.x_studio_lead_time_days === false ? null : row.x_studio_lead_time_days,
    validityDays: row.x_studio_validity_days === false ? null : row.x_studio_validity_days,
    includesDelivery: row.x_studio_includes_delivery,
    includesTax: row.x_studio_includes_tax,
    fxRate: row.x_studio_fx_rate === false ? null : row.x_studio_fx_rate,
    fxRateDate: row.x_studio_fx_rate_date || null,
    fxSnapshotAt: row.x_studio_fx_snapshot_at || null,
    taxState: row.x_studio_tax_inclusion_state || "unknown",
    deliveryState: row.x_studio_delivery_inclusion_state || "unknown",
  };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * يفحص جاهزية عرض العميل بعد كل اعتماد فائز: يحتاج مورداً فائزاً بسعر مستخرَج، وناقلاً فائزاً
 * إن كانت جولة مقارنة شحن قد فُتحت أصلاً لهذا الطلب (وإلا يُسعَّر بلا مكوّن شحن).
 * يحسب التسعير (تكلفة + هامش) ويكتبه بحقول التسعير الجاهزة على الطلب، ثم ينشئ AI Task +
 * approval.request حقيقي بفئة "إرسال عرض العميل" — الإرسال الفعلي للعميل يتم فقط بعد الاعتماد البشري (بالكرون).
 * لا يكرر الإنشاء لو سبق أن أُنشئ قرار عرض عميل لنفس الطلب.
 */
export async function checkAndTriggerCustomerOffer(requestId: number): Promise<void> {
  const claimKey = `customer-offer:${requestId}`;
  const claimInitial = { status: "processing" as const, submissionId: claimKey, correlationId: randomUUID(), stage: "creating_customer_offer" };
  const claim = await claimSubmission(claimKey, claimInitial);
  if (!claim.claimed) return;
  try {
  const stop = async (stage: string) => {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "failed", stage });
  };
  const existingDecision = await searchRead<{ id: number }>(
    "x_build_ai_approval",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_decision_type", "=", CUSTOMER_OFFER_DECISION_TYPE],
    ],
    ["id"],
    { limit: 1 }
  );
  if (existingDecision.length) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "completed", requestId: existingDecision[0].id, stage: "existing_customer_offer" });
    return;
  }

  const supplierWinner = await getWinnerQuote(requestId, "supplier");
  if (!supplierWinner || supplierWinner.totalPrice === null) { await stop("supplier_winner_missing"); return; }
  // عرض مورد فائز بعملة تعذّر تحويلها لSAR لا يجوز تسعيره آلياً — يُترك للمعالجة اليدوية (لا نُرسل رقماً خاطئاً)
  if (supplierWinner.totalPriceSar === null) {
    await postProcurementRequestNote(
      requestId,
      `تعذّر إعداد عرض العميل آلياً: عرض المورد الفائز بعملة "${supplierWinner.currency}" بلا سعر صرف نشط في Odoo. فعّل العملة وسعر صرفها في Odoo أو سعّر الطلب يدوياً.`
    );
    await stop("supplier_fx_missing"); return;
  }

  // مكوّن الشحن مطلوب فقط إن كانت جولة مقارنة شحن قد فُتحت لهذا الطلب — إن كانت مفتوحة ولم يُعتمَد فائزها بعد، ننتظر (يُعاد الفحص عند اعتماده)
  const freightRound = await searchRead<{ id: number }>(
    "x_build_ai_approval",
    [
      ["x_studio_request_id", "=", requestId],
      ["x_studio_decision_type", "=", WINNER_DECISION_TYPE.freight],
    ],
    ["id"],
    { limit: 1 }
  );
  let freightWinner: WinnerQuote | null = null;
  if (freightRound.length) {
    freightWinner = await getWinnerQuote(requestId, "freight");
    if (!freightWinner || freightWinner.totalPrice === null) { await stop("freight_winner_missing"); return; }
    if (freightWinner.totalPriceSar === null) {
      await postProcurementRequestNote(
        requestId,
        `تعذّر إعداد عرض العميل آلياً: عرض الناقل الفائز بعملة "${freightWinner.currency}" بلا سعر صرف نشط في Odoo.`
      );
      await stop("freight_fx_missing"); return;
    }
  }

  // احترام التجاوز اليدوي: إن كان الفريق قد سعّر الطلب يدوياً، لا نكتب فوق حساباته
  const overrideRows = await read<{ x_studio_cost_manual_override: boolean }>(
    "x_build_procurement_request",
    [requestId],
    ["x_studio_cost_manual_override"]
  );
  if (overrideRows[0]?.x_studio_cost_manual_override) { await stop("manual_override"); return; }

  // كل الحسابات بعملة موحّدة (SAR) بعد التحويل بأسعار Odoo — لا جمع/مقارنة أرقام بعملات مختلفة
  if (supplierWinner.taxState === "unknown" || supplierWinner.deliveryState === "unknown") {
    await postProcurementRequestNote(requestId, "تعذر التسعير الآلي: حالة شمول ضريبة القيمة المضافة أو التوصيل في عرض المورد غير معروفة.");
    await stop("supplier_inclusion_unknown"); return;
  }
  const vatRatePct = Number(process.env.SAUDI_VAT_RATE_PCT ?? 15);
  if (!Number.isFinite(vatRatePct) || vatRatePct < 0) throw new Error("Invalid SAUDI_VAT_RATE_PCT");
  let freightNetSar: number | null = null;
  if (freightWinner) {
    if (freightWinner.taxState === "unknown" || freightWinner.totalPriceSar === null) {
      await postProcurementRequestNote(requestId, "تعذر التسعير الآلي: حالة ضريبة عرض الشحن غير معروفة.");
      await stop("freight_tax_unknown"); return;
    }
    freightNetSar = freightWinner.taxState === "included"
      ? round2(freightWinner.totalPriceSar / (1 + vatRatePct / 100))
      : freightWinner.totalPriceSar;
  }
  const rawMarkup = Number(process.env.CUSTOMER_QUOTE_MARKUP_PCT);
  const markupPct = Number.isFinite(rawMarkup) && rawMarkup >= 0 ? rawMarkup : DEFAULT_CUSTOMER_MARKUP_PCT;
  let normalized;
  try {
    normalized = normalizeCustomerPricing({
      supplierGrossSar: supplierWinner.totalPriceSar,
      taxState: supplierWinner.taxState,
      deliveryState: supplierWinner.deliveryState,
      externalFreightSar: freightNetSar,
      vatRatePct,
      markupPct,
    });
  } catch (error) {
    await postProcurementRequestNote(requestId, `تعذر التسعير الآلي: ${error instanceof Error ? error.message : "بيانات مالية متناقضة"}`);
    await stop("financial_normalization_failed"); return;
  }
  const materialsCostSar = normalized.materialsNetSar;
  const freightCostSar = normalized.externalFreightSar;
  const totalCost = normalized.procurementCostSar;
  const salePrice = normalized.customerTaxableBaseSar;
  const margin = normalized.markupSar;
  const grossMarginPct = salePrice > 0 ? round2((margin / salePrice) * 100) : 0;

  // نكتب حقول الإدخال + الحقول المشتقّة معاً (بالـSAR) — لا اعتماد على أتمتة خارجية غير مضمونة لاشتقاق الهامش
  await write("x_build_procurement_request", [requestId], {
    x_studio_materials_cost: materialsCostSar,
    x_studio_freight_cost: freightCostSar,
    x_studio_total_cost: totalCost,
    x_studio_sale_price: salePrice,
    x_studio_margin: margin,
    x_studio_markup_pct: markupPct,
    x_studio_gross_margin_pct: grossMarginPct,
    x_studio_materials_net_cost: normalized.materialsNetSar,
    x_studio_supplier_input_vat: normalized.supplierInputVatSar,
    x_studio_customer_taxable_base: normalized.customerTaxableBaseSar,
    x_studio_output_vat: normalized.outputVatSar,
    x_studio_customer_gross_total: normalized.customerGrossSar,
    x_studio_fx_rate: supplierWinner.fxRate ?? false,
    x_studio_fx_rate_date: supplierWinner.fxRateDate || false,
    x_studio_fx_snapshot_at: supplierWinner.fxSnapshotAt || false,
    x_studio_fx_source: "odoo.res.currency.rate",
    x_studio_quote_scenario: "auto-v1",
    x_studio_internal_status: "preparing_customer_offer",
    x_studio_customer_status: "quote_preparing",
  });

  const flags = (quote: WinnerQuote) =>
    `${quote.includesDelivery ? "شامل التوصيل" : "غير شامل التوصيل"} | ${quote.includesTax ? "شامل الضريبة" : "غير شامل الضريبة"}`;
  const costLabel = (quote: WinnerQuote, sar: number) =>
    quote.currency === "SAR" ? `${quote.totalPrice} SAR` : `${quote.totalPrice} ${quote.currency} (= ${sar} SAR)`;
  const summary = [
    `عرض سعر العميل للطلب #${requestId} (محسوب آلياً من العروض الفائزة المعتمدة، كل المبالغ موحّدة بالـSAR بأسعار Odoo):`,
    `تكلفة التوريد: ${costLabel(supplierWinner, materialsCostSar)} — ${supplierWinner.partnerName} (${flags(supplierWinner)})`,
    freightWinner
      ? `تكلفة الشحن: ${costLabel(freightWinner, freightCostSar)} — ${freightWinner.partnerName} (${flags(freightWinner)})`
      : `تكلفة الشحن: لا توجد جولة عروض شحن لهذا الطلب — التسعير بلا مكوّن شحن`,
    `إجمالي التكلفة: ${totalCost} SAR`,
    `الهامش: ${markupPct}% على التكلفة = ${margin} SAR (${grossMarginPct}% من سعر البيع)`,
    `سعر البيع النهائي للعميل: ${salePrice} SAR (سيُعرض للعميل غير شامل ضريبة القيمة المضافة)`,
    supplierWinner.leadTimeDays !== null ? `مدة التجهيز المتوقعة: ${supplierWinner.leadTimeDays} يوم` : null,
    ``,
    `عند الاعتماد سيُرسَل عرض السعر تلقائياً لبريد العميل (السعر النهائي فقط، بدون أي تفاصيل تكلفة أو هامش).`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const task = await createBuildAiTask({
    agentName: CUSTOMER_OFFER_AGENT_NAME,
    requestId,
    taskType: "customer_offer_drafting",
    result: summary,
    needsApproval: true,
    status: "needs_approval",
  });
  if (!task) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "failed", stage: "task_not_created" });
    return;
  }

  const categoryId = await ensureApprovalCategoryId(CUSTOMER_OFFER_CATEGORY_NAME, WINNER_CATEGORY_NAME.supplier);
  let approvalRequestId: number | null = null;
  if (categoryId) {
    approvalRequestId = await create("approval.request", {
      name: `${CUSTOMER_OFFER_CATEGORY_NAME} - Request #${requestId}`,
      category_id: categoryId,
      reference: `Build Request #${requestId}`,
      x_studio_build_request_id: requestId,
      reason: `<p>${escapeOdooHtml(summary).replace(/\n/g, "<br/>")}</p>`,
    });
    try {
      await callMethod("approval.request", "action_confirm", [[approvalRequestId]]);
    } catch (error) {
      console.error("[odoo] customer-offer approval.request action_confirm failed (left as draft):", error instanceof Error ? error.message : error);
    }
  }

  const decisionId = await create("x_build_ai_approval", {
    x_name: `${CUSTOMER_OFFER_CATEGORY_NAME} - Request #${requestId}`,
    x_studio_agent_id: task.agentId,
    x_studio_task_id: task.taskId,
    x_studio_request_id: requestId,
    x_studio_decision_type: CUSTOMER_OFFER_DECISION_TYPE,
    x_studio_recommendation: summary,
    x_studio_approval_request_id: approvalRequestId || false,
    x_studio_status: "pending",
  });
  await saveSubmissionState(claimKey, { ...claimInitial, status: "completed", requestId: decisionId, stage: "customer_offer_created" });
  } catch (error) {
    await saveSubmissionState(claimKey, { ...claimInitial, status: "failed", stage: "customer_offer_failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) }).catch(() => undefined);
    throw error;
  }
}

export type PendingCustomerOfferDecision = {
  id: number;
  requestId: number;
  taskId: number;
  approvalRequestId: number;
  approvalStatus: "approved" | "refused";
};

export async function getPendingCustomerOfferDecisions(): Promise<PendingCustomerOfferDecision[]> {
  const rows = await searchRead<{
    id: number;
    x_studio_request_id: [number, string] | false;
    x_studio_task_id: [number, string] | false;
    x_studio_approval_request_id: [number, string] | false;
  }>(
    "x_build_ai_approval",
    [
      ["x_studio_status", "=", "pending"],
      ["x_studio_decision_type", "=", CUSTOMER_OFFER_DECISION_TYPE],
      ["x_studio_approval_request_id", "!=", false],
    ],
    ["x_studio_request_id", "x_studio_task_id", "x_studio_approval_request_id"],
    { limit: 50, order: "id asc" }
  );

  const approvalIds = rows.map((row) => row.x_studio_approval_request_id && row.x_studio_approval_request_id[0]).filter((id): id is number => typeof id === "number");
  if (!approvalIds.length) return [];
  const approvalRows = await read<{ id: number; request_status: string | false }>("approval.request", approvalIds, ["request_status"]);
  const statusById = new Map(approvalRows.map((row) => [row.id, row.request_status]));

  return rows
    .map((row) => {
      const approvalRequestId = row.x_studio_approval_request_id && row.x_studio_approval_request_id[0];
      const status = typeof approvalRequestId === "number" ? statusById.get(approvalRequestId) : null;
      if (status !== "approved" && status !== "refused") return null;
      if (!row.x_studio_request_id || !row.x_studio_task_id || typeof approvalRequestId !== "number") return null;
      return {
        id: row.id,
        requestId: row.x_studio_request_id[0],
        taskId: row.x_studio_task_id[0],
        approvalRequestId,
        approvalStatus: status,
      } as PendingCustomerOfferDecision;
    })
    .filter((row): row is PendingCustomerOfferDecision => !!row);
}

export type CustomerOfferEmailData = {
  contactName: string;
  email: string;
  trackingNumber: string;
  trackingToken: string;
  projectName: string;
  salePrice: number;
  leadTimeDays: number | null;
  validityDays: number;
};

/** بيانات إيميل عرض السعر للعميل — سعر البيع فقط، بلا أي تكلفة/هامش. صلاحية العرض لا تتجاوز صلاحية عرض المورد الفائز */
export async function getCustomerOfferEmailData(requestId: number): Promise<CustomerOfferEmailData | null> {
  const rows = await read<{
    x_name: string | false;
    x_studio_email: string | false;
    x_studio_tracking_number: string | false;
    x_studio_tracking_token: string | false;
    x_studio_project_name: string | false;
    x_studio_sale_price: number | false;
  }>(
    "x_build_procurement_request",
    [requestId],
    ["x_name", "x_studio_email", "x_studio_tracking_number", "x_studio_tracking_token", "x_studio_project_name", "x_studio_sale_price"]
  );
  const row = rows[0];
  if (!row?.x_studio_email || !row.x_studio_sale_price) return null;

  const supplierWinner = await getWinnerQuote(requestId, "supplier");
  const validityDays = Math.min(7, supplierWinner?.validityDays || 7);

  return {
    contactName: row.x_name || "",
    email: row.x_studio_email,
    trackingNumber: row.x_studio_tracking_number || "",
    trackingToken: row.x_studio_tracking_token || "",
    projectName: row.x_studio_project_name || "",
    salePrice: row.x_studio_sale_price,
    leadTimeDays: supplierWinner?.leadTimeDays ?? null,
    validityDays,
  };
}

export async function markCustomerOfferApproved(decision: PendingCustomerOfferDecision): Promise<void> {
  await write("x_build_ai_approval", [decision.id], { x_studio_status: "approved" });
  await write("x_build_ai_task", [decision.taskId], { x_studio_status: "completed", x_studio_needs_approval: false });
  await write("x_build_procurement_request", [decision.requestId], {
    x_studio_internal_status: "customer_offer_sent",
    x_studio_customer_status: "quote_ready",
  });
  await postProcurementRequestNote(decision.requestId, "أُرسل عرض السعر للعميل عبر البريد بعد الاعتماد — بانتظار رد العميل.");
}

/** عند رفض إرسال العرض: يُعاد الطلب لحالة المقارنة ليعدّل الفريق التسعير يدوياً من أودو ثم يعيد الدورة */
export async function markCustomerOfferRejected(decision: PendingCustomerOfferDecision): Promise<void> {
  await write("x_build_ai_approval", [decision.id], { x_studio_status: "rejected" });
  await write("x_build_ai_task", [decision.taskId], {
    x_studio_status: "failed",
    x_studio_needs_approval: false,
    x_studio_error: "Customer offer approval was refused",
  });
  await write("x_build_procurement_request", [decision.requestId], {
    x_studio_internal_status: "comparing",
    x_studio_customer_status: "pricing",
  });
  await postProcurementRequestNote(decision.requestId, "رُفض إرسال عرض السعر المحسوب آلياً — أُعيد الطلب لحالة المقارنة للمراجعة اليدوية.");
}
