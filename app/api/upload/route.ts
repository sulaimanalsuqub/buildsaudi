import { NextRequest, NextResponse } from "next/server";
import { uploadERPNextFile } from "@/lib/erpnext";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { createUploadAttachToken } from "@/lib/upload-token";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

function isPdfMagic(head: Uint8Array) {
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
}

// التحقق من Magic Bytes للتأكد أن محتوى الملف يطابق نوعه المُعلَن
async function isValidFileContent(file: File, head: Uint8Array): Promise<boolean> {
  // CSV: ملف نصي، لا magic bytes مطلوبة
  if (file.type === "text/csv") return true;

  const looksPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf") ||
    isPdfMagic(head);

  // PDF: %PDF = 25 50 44 46
  if (looksPdf) {
    return isPdfMagic(head);
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

    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const isPdfByMagic = isPdfMagic(head);
    const isPdfUpload = isPdfByMagic || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isBoqUpload = String(formData.get("folder") || "") === "boq";

    if (!isBoqUpload && !isPdfUpload) {
      return NextResponse.json({ error: "نوع الملف غير مسموح — ارفع ملف PDF فقط" }, { status: 400 });
    }

    if (isBoqUpload && file.type && !ALLOWED_TYPES.includes(file.type) && !isPdfByMagic) {
      return NextResponse.json({ error: "نوع الملف غير مسموح" }, { status: 400 });
    }

    const contentValid = await isValidFileContent(file, head);
    if (!contentValid) {
      return NextResponse.json({ error: "محتوى الملف لا يتطابق مع نوعه" }, { status: 400 });
    }

    let extractedText = "";
    if (isBoqUpload) {
      try {
        const { extractTextFromProcurementFile } = await import("@/lib/file-text");
        extractedText = await extractTextFromProcurementFile(file);
      } catch (extractError) {
        console.error("BOQ text extraction failed:", extractError);
      }
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
    const message = e instanceof Error ? e.message : "";
    if (message.includes("401")) {
      return NextResponse.json({ error: "تعذر الاتصال بنظام الملفات — تواصل مع الدعم" }, { status: 500 });
    }
    if (message.includes("upload error: 500") || message.toLowerCase().includes("pdf")) {
      return NextResponse.json(
        { error: "تعذر معالجة ملف PDF — تأكد أن الملف سليم أو أعد تصديره كـ PDF" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "فشل رفع الملف — حاول مرة أخرى" }, { status: 500 });
  }
}
