import { randomUUID } from "crypto";

/**
 * عميل ERPNext موحّد (Frappe REST API, token auth) — طبقة التكامل الوحيدة بين buildsaudi وERPNext.
 * لا تبنِ fetch خاص في المسارات؛ استخدم هذه الدوال (spec §39).
 * لا يُسجَّل أي secret أو جسم استجابة حساس.
 */

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

type ErpnextConfig = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  company: string;
  timeoutMs: number;
};

/** هل ERPNext مهيّأ؟ يُستخدم كمفتاح تبديل آمن (fallback لـBuild-OPT عند التعطيل) */
export function isErpnextConfigured(): boolean {
  return Boolean(process.env.ERPNEXT_BASE_URL && process.env.ERPNEXT_API_KEY && process.env.ERPNEXT_API_SECRET);
}

function getConfig(): ErpnextConfig {
  const baseUrl = process.env.ERPNEXT_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.ERPNEXT_API_KEY;
  const apiSecret = process.env.ERPNEXT_API_SECRET;
  if (!baseUrl || !apiKey || !apiSecret) {
    throw new Error("ERPNext is not configured (ERPNEXT_BASE_URL/ERPNEXT_API_KEY/ERPNEXT_API_SECRET)");
  }
  const company = process.env.ERPNEXT_COMPANY || "EFAD FOR MARKETING";
  const timeoutMs = Number(process.env.ERPNEXT_REQUEST_TIMEOUT ?? 15000);
  return { baseUrl, apiKey, apiSecret, company, timeoutMs };
}

export function erpnextCompany(): string {
  return process.env.ERPNEXT_COMPANY || "EFAD FOR MARKETING";
}

// ─────────────────────────────────────────────────────────────
// Error normalization (يطابق نمط OdooClientError)
// ─────────────────────────────────────────────────────────────

export type ErpnextErrorKind =
  | "network"
  | "timeout"
  | "validation"
  | "auth"
  | "permission"
  | "conflict"
  | "not_found"
  | "unknown";

export class ErpnextClientError extends Error {
  kind: ErpnextErrorKind;
  retryable: boolean;
  correlationId: string;
  status: number | null;
  /** رسالة صالحة للعرض للمستخدم دون كشف تفاصيل داخلية */
  publicMessage: string;

  constructor(params: {
    message: string;
    kind: ErpnextErrorKind;
    retryable: boolean;
    correlationId: string;
    status?: number | null;
    publicMessage?: string;
  }) {
    super(params.message);
    this.name = "ErpnextClientError";
    this.kind = params.kind;
    this.retryable = params.retryable;
    this.correlationId = params.correlationId;
    this.status = params.status ?? null;
    this.publicMessage = params.publicMessage ?? "تعذر إتمام العملية في نظام العمليات";
  }
}

function classifyError(raw: string, httpStatus: number | null): { kind: ErpnextErrorKind; retryable: boolean } {
  const lower = raw.toLowerCase();
  if (httpStatus === 401) return { kind: "auth", retryable: false };
  if (httpStatus === 403) return { kind: "permission", retryable: false };
  if (httpStatus === 404) return { kind: "not_found", retryable: false };
  if (httpStatus === 409) return { kind: "conflict", retryable: false };
  if (httpStatus !== null && httpStatus >= 500) return { kind: "network", retryable: true };

  if (lower.includes("permissionerror") || lower.includes("not permitted") || lower.includes("insufficient permission")) {
    return { kind: "permission", retryable: false };
  }
  if (lower.includes("authenticationerror") || lower.includes("invalid api") || lower.includes("session expired")) {
    return { kind: "auth", retryable: false };
  }
  if (lower.includes("doesnotexist") || lower.includes("not found")) {
    return { kind: "not_found", retryable: false };
  }
  if (lower.includes("duplicateentry") || lower.includes("already exists") || lower.includes("duplicate")) {
    return { kind: "conflict", retryable: false };
  }
  if (lower.includes("validationerror") || lower.includes("mandatory") || lower.includes("linkvalidationerror")) {
    return { kind: "validation", retryable: false };
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

/** يستخرج رسالة خطأ Frappe المقروءة من جسم الاستجابة دون كشف stack traces */
function extractFrappeError(bodyText: string): string {
  try {
    const body = JSON.parse(bodyText) as {
      exc_type?: string;
      exception?: string;
      _server_messages?: string;
      message?: string;
    };
    if (body._server_messages) {
      try {
        const msgs = JSON.parse(body._server_messages) as string[];
        const parsed = msgs
          .map((m) => {
            try {
              return (JSON.parse(m) as { message?: string }).message || m;
            } catch {
              return m;
            }
          })
          .join("; ");
        if (parsed) return `${body.exc_type || "Error"}: ${parsed}`;
      } catch {
        /* fallthrough */
      }
    }
    if (body.exc_type) return body.exc_type;
    if (typeof body.message === "string") return body.message;
  } catch {
    /* not JSON */
  }
  return bodyText.slice(0, 300);
}

// ─────────────────────────────────────────────────────────────
// Transport
// ─────────────────────────────────────────────────────────────

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options: { body?: unknown; correlationId?: string } = {}
): Promise<T> {
  const config = getConfig();
  const correlationId = options.correlationId ?? randomUUID();
  const url = `${config.baseUrl}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `token ${config.apiKey}:${config.apiSecret}`,
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    const kind: ErpnextErrorKind = /timeout|abort/i.test(msg) ? "timeout" : "network";
    throw new ErpnextClientError({
      message: `erpnext ${kind}: ${msg}`,
      kind,
      retryable: true,
      correlationId,
      publicMessage: kind === "timeout" ? "النظام تحت ضغط — حاول بعد قليل" : "تعذّر الوصول لنظام العمليات — حاول لاحقاً",
    });
  }

  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore */
    }
    const detail = extractFrappeError(bodyText);
    const { kind, retryable } = classifyError(`${detail} ${bodyText}`, res.status);
    throw new ErpnextClientError({
      message: `erpnext ${res.status}: ${detail}`,
      kind,
      retryable,
      correlationId,
      status: res.status,
    });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function encode(segment: string): string {
  return encodeURIComponent(segment);
}

// ─────────────────────────────────────────────────────────────
// CRUD helpers
// ─────────────────────────────────────────────────────────────

export type ErpFilter = [string, string, unknown];

export async function getList<T = Record<string, unknown>>(
  doctype: string,
  opts: { filters?: ErpFilter[]; fields?: string[]; limit?: number; orderBy?: string; correlationId?: string } = {}
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("fields", JSON.stringify(opts.fields ?? ["name"]));
  if (opts.filters?.length) params.set("filters", JSON.stringify(opts.filters));
  params.set("limit_page_length", String(opts.limit ?? 20));
  if (opts.orderBy) params.set("order_by", opts.orderBy);
  const res = await request<{ data: T[] }>("GET", `/api/resource/${encode(doctype)}?${params.toString()}`, {
    correlationId: opts.correlationId,
  });
  return res.data;
}

export async function getDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  correlationId?: string
): Promise<T> {
  const res = await request<{ data: T }>("GET", `/api/resource/${encode(doctype)}/${encode(name)}`, { correlationId });
  return res.data;
}

export async function docExists(doctype: string, name: string, correlationId?: string): Promise<boolean> {
  try {
    await getDoc(doctype, name, correlationId);
    return true;
  } catch (error) {
    if (error instanceof ErpnextClientError && error.kind === "not_found") return false;
    throw error;
  }
}

export async function createDoc<T = Record<string, unknown>>(
  doctype: string,
  doc: Record<string, unknown>,
  correlationId?: string
): Promise<T & { name: string }> {
  const res = await request<{ data: T & { name: string } }>("POST", `/api/resource/${encode(doctype)}`, {
    body: doc,
    correlationId,
  });
  return res.data;
}

export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  patch: Record<string, unknown>,
  correlationId?: string
): Promise<T & { name: string }> {
  const res = await request<{ data: T & { name: string } }>(
    "PUT",
    `/api/resource/${encode(doctype)}/${encode(name)}`,
    { body: patch, correlationId }
  );
  return res.data;
}

export async function callMethod<T = unknown>(
  method: string,
  args: Record<string, unknown> = {},
  correlationId?: string
): Promise<T> {
  const res = await request<{ message: T }>("POST", `/api/method/${method}`, { body: args, correlationId });
  return res.message;
}

/** إضافة Tag أصلي (native) لمستند */
export async function addTag(doctype: string, name: string, tag: string, correlationId?: string): Promise<void> {
  await callMethod("frappe.desk.doctype.tag.tag.add_tag", { tag, dt: doctype, dn: name }, correlationId);
}

/** إضافة تعليق timeline أصلي لمستند (للملاحظات التشغيلية) */
export async function addComment(
  referenceDoctype: string,
  referenceName: string,
  content: string,
  correlationId?: string
): Promise<void> {
  await createDoc(
    "Comment",
    {
      comment_type: "Comment",
      reference_doctype: referenceDoctype,
      reference_name: referenceName,
      content,
    },
    correlationId
  );
}

/** رفع ملف وربطه بمستند (private افتراضياً). base64 بدون prefix الـdata URI */
export async function uploadFileToDoc(params: {
  fileName: string;
  base64Data: string;
  mimeType: string;
  doctype: string;
  docname: string;
  isPrivate?: boolean;
  correlationId?: string;
}): Promise<{ file_url: string; name: string }> {
  const config = getConfig();
  const correlationId = params.correlationId ?? randomUUID();
  const bytes = Buffer.from(params.base64Data, "base64");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: params.mimeType }), params.fileName);
  form.append("is_private", params.isPrivate === false ? "0" : "1");
  form.append("doctype", params.doctype);
  form.append("docname", params.docname);

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/api/method/upload_file`, {
      method: "POST",
      headers: { Authorization: `token ${config.apiKey}:${config.apiSecret}`, Accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    throw new ErpnextClientError({
      message: `erpnext upload ${msg}`,
      kind: /timeout|abort/i.test(msg) ? "timeout" : "network",
      retryable: true,
      correlationId,
    });
  }
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore */
    }
    const detail = extractFrappeError(bodyText);
    const { kind, retryable } = classifyError(`${detail} ${bodyText}`, res.status);
    throw new ErpnextClientError({ message: `erpnext upload ${res.status}: ${detail}`, kind, retryable, correlationId, status: res.status });
  }
  const body = (await res.json()) as { message: { file_url: string; name: string } };
  return body.message;
}
