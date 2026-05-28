import { NextRequest, NextResponse } from "next/server";
import { uploadERPNextFile } from "@/lib/erpnext";
import { extractTextFromProcurementFile } from "@/lib/file-text";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok, resetAt } = checkRateLimit(clientId, "api");
    if (!ok) return rateLimitError(resetAt, "upload");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حجم الملف أكبر من 10MB" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مسموح" }, { status: 400 });
    }

    let extractedText = "";
    try {
      extractedText = await extractTextFromProcurementFile(file);
    } catch (extractError) {
      console.error("BOQ text extraction failed:", extractError);
    }

    const uploaded = await uploadERPNextFile(file);
    return NextResponse.json({
      ok: true,
      url: uploaded.fileUrl,
      fileName: uploaded.name,
      originalName: uploaded.fileName,
      extractedText,
    });
  } catch (e) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
