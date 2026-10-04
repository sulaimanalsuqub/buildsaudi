import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getList, uploadFileToDoc } from "./erpnext.ts";
import { ErpnextVendorError } from "./erpnext-vendor-registration.ts";
import { validateVendorFileContent, type VendorFileManifest } from "./vendor-registration-files.ts";
import { MAX_VENDOR_FILES } from "./vendor-file-policy.ts";

/**
 * نقل تدفّق ملفات الموردين من Odoo إلى ERPNext باستخدام Frappe File الأصلي (Attachment على Supplier).
 * التوكن هنا يحمل **اسم Supplier النصّي** (SUP-...) بدل المعرّف الرقمي في مسار Odoo، موقّع HMAC.
 * لا Custom DocType — فقط File الأصلي مرتبط بـSupplier.
 */

function secret(): string {
  const key = process.env.UPLOAD_TOKEN_SECRET || process.env.ERPNEXT_API_SECRET;
  if (!key) throw new ErpnextVendorError("Upload signing is not configured");
  return key;
}

export function createErpnextVendorFilesToken(supplier: string, files: VendorFileManifest[]): string {
  const body = Buffer.from(JSON.stringify({ supplier, files, expires: Date.now() + 60 * 60_000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(`erpnext-vendor-files:${body}`).digest("base64url")}`;
}

export function readErpnextVendorFilesToken(token: string): { supplier: string; files: VendorFileManifest[] } {
  try {
    const [body, signature, extra] = token.split(".");
    const expected = createHmac("sha256", secret()).update(`erpnext-vendor-files:${body}`).digest();
    const received = Buffer.from(signature || "", "base64url");
    if (extra || received.length !== expected.length || !timingSafeEqual(received, expected)) throw Error();
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (
      data.expires < Date.now() ||
      typeof data.supplier !== "string" ||
      !data.supplier ||
      !Array.isArray(data.files) ||
      data.files.length > MAX_VENDOR_FILES
    ) {
      throw Error();
    }
    return data;
  } catch {
    throw new ErpnextVendorError("Invalid upload authorization", 403, "انتهت صلاحية رفع الملفات. أعد إرسال النموذج لاستكمال الرفع.");
  }
}

export async function uploadVendorRegistrationFileErpnext(token: string, file: File): Promise<string> {
  const authorization = readErpnextVendorFilesToken(token);
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const item = authorization.files.find((f) => f.name === file.name && f.size === file.size && f.type === file.type && f.sha256 === sha256);
  if (!item) throw new ErpnextVendorError("File outside authorized manifest", 403, "هذا الملف غير مشمول بطلب التسجيل.");
  await validateVendorFileContent(item, buffer);

  const supplier = authorization.supplier;
  // idempotent: نفس الاسم مرفقاً بنفس المورد → لا تكرار
  const existing = await getList<{ name: string }>("File", {
    filters: [
      ["attached_to_doctype", "=", "Supplier"],
      ["attached_to_name", "=", supplier],
      ["file_name", "=", file.name],
    ],
    fields: ["name"],
    limit: 1,
  });
  if (existing[0]?.name) return existing[0].name;

  const uploaded = await uploadFileToDoc({
    fileName: file.name,
    base64Data: buffer.toString("base64"),
    mimeType: file.type,
    doctype: "Supplier",
    docname: supplier,
    isPrivate: true,
  });
  return uploaded.name;
}
