const MAX_DECODED_BYTES = 8 * 1024 * 1024;

export type SafeUploadKind = "pdf" | "csv";

/** Validate both declared metadata and bytes before attaching or parsing untrusted files. */
export function validateSafeUpload(file: { name: string; mimeType: string; base64Data: string }): { ok: true; kind: SafeUploadKind } | { ok: false; error: string } {
  const name = file.name.trim();
  if (!name || /[\\/\0]/.test(name)) return { ok: false, error: "اسم الملف غير آمن" };
  let bytes: Buffer;
  try {
    if (!/^[A-Za-z0-9+/=\s]+$/.test(file.base64Data)) return { ok: false, error: "ترميز الملف غير صالح" };
    bytes = Buffer.from(file.base64Data, "base64");
  } catch { return { ok: false, error: "ترميز الملف غير صالح" }; }
  if (!bytes.length || bytes.length > MAX_DECODED_BYTES) return { ok: false, error: "حجم الملف غير مسموح" };
  const type = file.mimeType.toLowerCase().split(";")[0].trim();
  const isPdf = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  if (isPdf) return type === "application/pdf" && /\.pdf$/i.test(name) ? { ok: true, kind: "pdf" } : { ok: false, error: "نوع ملف PDF لا يطابق محتواه" };
  const isCsv = (type === "text/csv" || type === "application/csv") && /\.csv$/i.test(name);
  if (isCsv && !bytes.includes(0)) return { ok: true, kind: "csv" };
  return { ok: false, error: "ندعم فقط PDF أو CSV مطابقاً لمحتواه؛ XLS/XLSX معطّل للمراجعة الأمنية" };
}
