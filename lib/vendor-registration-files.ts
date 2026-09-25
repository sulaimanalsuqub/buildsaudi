import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { unzipSync } from "fflate";
import { vendorOdooCall, VendorRegistrationError } from "./vendor-registration.ts";
import { MAX_VENDOR_FILES, validateVendorFileMetadata } from "./vendor-file-policy.ts";

export type VendorFileManifest = { name: string; size: number; type: string; sha256: string };
const secret = () => {
  const key = process.env.UPLOAD_TOKEN_SECRET || process.env.VENDOR_ODOO_API_KEY || process.env.ODOO_API_KEY;
  if (!key) throw new VendorRegistrationError("Upload signing is not configured");
  return key;
};
export function createVendorFilesToken(vendorId: number, files: VendorFileManifest[]) {
  const body = Buffer.from(JSON.stringify({ vendorId, files, expires: Date.now() + 60 * 60_000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(`vendor-files:${body}`).digest("base64url")}`;
}
export function readVendorFilesToken(token: string): { vendorId: number; files: VendorFileManifest[] } {
  try {
    const [body, signature, extra] = token.split(".");
    const expected = createHmac("sha256", secret()).update(`vendor-files:${body}`).digest();
    const received = Buffer.from(signature || "", "base64url");
    if (extra || received.length !== expected.length || !timingSafeEqual(received, expected)) throw Error();
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.expires < Date.now() || !Number.isInteger(data.vendorId) || data.vendorId < 1 || !Array.isArray(data.files) || data.files.length > MAX_VENDOR_FILES) throw Error();
    return data;
  } catch { throw new VendorRegistrationError("Invalid upload authorization", 403, "انتهت صلاحية رفع الملفات. أعد إرسال النموذج لاستكمال الرفع."); }
}

export async function validateVendorFileContent(file: VendorFileManifest, buffer: Buffer) {
  if (validateVendorFileMetadata(file) || buffer.length !== file.size || createHash("sha256").update(buffer).digest("hex") !== file.sha256) throw new VendorRegistrationError("Invalid file", 400, "الملف غير صالح أو يتجاوز الحد المسموح (3MB).");
  const ext = file.name.split(".").pop()!.toLowerCase();
  const detected = await fileTypeFromBuffer(buffer).catch(() => undefined);
  let valid = detected?.mime === file.type;
  if (ext === "doc" || ext === "xls") {
    const directory = buffer.toString("utf16le");
    valid = buffer.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")) && directory.includes(ext === "doc" ? "WordDocument" : "Workbook") && !/VBA|Macros|ObjectPool/i.test(directory);
  }
  if (ext === "docx" || ext === "xlsx") {
    let unpacked = 0;
    try {
      const entries = unzipSync(buffer, { filter(entry) {
        unpacked += entry.originalSize;
        if (unpacked > 30 * 1024 * 1024 || /vba|embeddings|activex|\.exe$|\.js$|\.bin$/i.test(entry.name)) throw Error();
        return entry.name === "[Content_Types].xml";
      } });
      if (!entries["[Content_Types].xml"] || /macroEnabled/i.test(new TextDecoder().decode(entries["[Content_Types].xml"]))) valid = false;
    } catch { valid = false; }
  }
  if (ext === "pdf" && /\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction)\b/i.test(buffer.toString("latin1"))) valid = false;
  if (!valid) throw new VendorRegistrationError("File content rejected", 400, "نوع الملف أو محتواه غير مسموح. استخدم مستندًا أو صورة بدون أكواد تنفيذية.");
}

export async function uploadVendorRegistrationFile(token: string, file: File) {
  const authorization = readVendorFilesToken(token);
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const item = authorization.files.find(f => f.name === file.name && f.size === file.size && f.type === file.type && f.sha256 === sha256);
  if (!item) throw new VendorRegistrationError("File outside authorized manifest", 403, "هذا الملف غير مشمول بطلب التسجيل.");
  await validateVendorFileContent(item, buffer);
  const vendorId = authorization.vendorId;
  const description = `Build Supplier Registration\nSHA256: ${sha256}`;
  const find = () => vendorOdooCall<{ id: number }[]>("documents.document", "search_read", {
    domain: [["partner_id", "=", vendorId], ["res_model", "=", "res.partner"], ["res_id", "=", vendorId], ["name", "=", file.name], ["description", "=", description]], fields: ["id"], limit: 1,
  });
  const existing = await find();
  if (existing.length) return existing[0].id;
  try {
    // Odoo creates the underlying ir.attachment in this same transaction.
    const ids = await vendorOdooCall<number[]>("documents.document", "create", { vals_list: [{
      name: file.name, raw: buffer.toString("base64"), partner_id: vendorId,
      res_model: "res.partner", res_id: vendorId, description,
      access_via_link: "none", access_internal: "view",
    }] });
    if (!Number.isInteger(ids[0]) || ids[0] <= 0) throw new VendorRegistrationError("Invalid document response");
    return ids[0];
  } catch (error) {
    const saved = await find().catch(() => []);
    if (saved.length) return saved[0].id;
    throw error;
  }
}
