import { NextRequest, NextResponse } from "next/server";
import { uploadVendorRegistrationFile } from "@/lib/vendor-registration-files";
import { isErpnextConfigured } from "@/lib/erpnext";
import { uploadVendorRegistrationFileErpnext } from "@/lib/erpnext-vendor-files";
import { ErpnextVendorError } from "@/lib/erpnext-vendor-registration";
import { MAX_VENDOR_FILE_BYTES, validateVendorFileMetadata } from "@/lib/vendor-file-policy";
import { VendorRegistrationError } from "@/lib/vendor-registration";
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
