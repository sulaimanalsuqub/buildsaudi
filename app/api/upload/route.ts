import { NextRequest, NextResponse } from "next/server";
import { uploadERPNextFile } from "@/lib/erpnext";
import { extractTextFromProcurementFile } from "@/lib/file-text";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { createUploadAttachToken } from "@/lib/upload-token";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

// التحقق من Magic Bytes للتأكد أن محتوى الملف يطابق نوعه المُعلَن
async function isValidFileContent(file: File): Promise<boolean> {
  // CSV: ملف نصي، لا magic bytes مطلوبة
  if (file.type === "text/csv") return true;

  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  // PDF: %PDF = 25 50 44 46
  if (file.type === "application/pdf") {
    return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  }

  // XLSX (ZIP format): PK\x03\x04 = 50 4B 03 04
  if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return head[0] === 0x50 && head[1] === 0x4B && head[2] === 0x03 && head[3] === 0x04;
  }

  // XLS (Compound Binary Format): D0 CF 11 E0
  if (file.type === "application/vnd.ms-excel") {
    return (
      (head[0] === 0xD0 && head[1] === 0xCF && head[2] === 0x11 && head[3] === 0xE0) ||
      // بعض ملفات XLS قديمة ترفع كـ ZIP أيضاً
      (head[0] === 0x50 && head[1] === 0x4B)
    );
  }

  return false;
}

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

    const contentValid = await isValidFileContent(file);
    if (!contentValid) {
      return NextResponse.json({ error: "محتوى الملف لا يتطابق مع نوعه" }, { status: 400 });
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
      attachToken: createUploadAttachToken(uploaded.name),
      extractedText,
    });
  } catch (e) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
