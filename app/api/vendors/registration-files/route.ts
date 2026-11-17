import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { isTempVendorFilesToken, readTempVendorFilesToken, uploadVendorRegistrationFile, validateVendorFileContent } from "@/lib/vendor-registration-files";
import { isErpnextConfigured } from "@/lib/erpnext";
import { uploadVendorRegistrationFileErpnext } from "@/lib/erpnext-vendor-files";
import { ErpnextVendorError } from "@/lib/erpnext-vendor-registration";
import { MAX_VENDOR_FILE_BYTES, validateVendorFileMetadata } from "@/lib/vendor-file-policy";
import { VendorRegistrationError } from "@/lib/vendor-registration";
import { sendVendorRegistrationFileBackupEmail } from "@/lib/email";
import { checkRateLimit, getClientIdentifier, rateLimitError } from "@/lib/rate-limit";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  const limit = checkRateLimit(getClientIdentifier(req), "api");
  if (!limit.ok) return rateLimitError(limit.resetAt, "رفع ملفات المورد");
  if (Number(req.headers.get("content-length")) > MAX_VENDOR_FILE_BYTES + 32_000) return NextResponse.json({ error: "الحد الأقصى للملف 3MB" }, { status: 413 });
  try {
    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File) || validateVendorFileMetadata(file)) return NextResponse.json({ error: "تحقق من نوع الملف واسمه وحجمه (3MB كحد أقصى)." }, { status: 400 });
    const token = String(data.get("token") || "");
    // ⚠️ مؤقت (2026-11-17): ERPNext/Odoo معطّلان — رمز مؤقت يعني لا نظام عمليات يستقبل الملف،
    // فنرسله كمرفق بريد احتياطي بدلاً من ذلك (انظر app/api/vendors/register/route.ts).
    if (isTempVendorFilesToken(token)) {
      const authorization = readTempVendorFilesToken(token);
      const buffer = Buffer.from(await file.arrayBuffer());
      const sha256 = createHash("sha256").update(buffer).digest("hex");
      const item = authorization.files.find((f) => f.name === file.name && f.size === file.size && f.type === file.type && f.sha256 === sha256);
      if (!item) return NextResponse.json({ error: "هذا الملف غير مشمول بطلب التسجيل." }, { status: 403 });
      await validateVendorFileContent(item, buffer);
      await sendVendorRegistrationFileBackupEmail({ reference: authorization.reference, fileName: file.name, fileBuffer: buffer, contentType: file.type });
      return NextResponse.json({ ok: true, documentId: `${authorization.reference}:${file.name}` });
    }
    if (isErpnextConfigured()) {
      const documentId = await uploadVendorRegistrationFileErpnext(token, file);
      return NextResponse.json({ ok: true, documentId });
    }
    const documentId = await uploadVendorRegistrationFile(token, file);
    return NextResponse.json({ ok: true, documentId });
  } catch (error) {
    const publicMsg =
      error instanceof ErpnextVendorError || error instanceof VendorRegistrationError
        ? error.publicMessage
        : "تعذر رفع الملف. طلب المورد محفوظ، ويمكنك إعادة محاولة الرفع.";
    const status = error instanceof ErpnextVendorError || error instanceof VendorRegistrationError ? error.status : 503;
    return NextResponse.json({ error: publicMsg }, { status });
  }
}
