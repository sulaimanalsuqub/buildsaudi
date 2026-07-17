import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  OdooClientError,
  createSupplierDocument,
  listSupplierDocuments,
  type SupplierDocumentType,
} from "@/lib/odoo";
import { resolveOnboardingProfile } from "@/lib/vendor-onboarding-guard";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_DOCUMENT_TYPES: SupplierDocumentType[] = [
  "cr_certificate",
  "vat_certificate",
  "bank_letter",
  "national_address",
  "registration_certificate",
  "other",
];

const EDITABLE_STATUSES = new Set(["completing_profile", "more_information_required"]);

function isPdfMagic(head: Uint8Array): boolean {
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "api");
  if (!ok) return rateLimitError(resetAt, "رفع مستند");

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });

  const token = String(formData.get("onboarding_token") || "");
  const documentType = String(formData.get("document_type") || "") as SupplierDocumentType;
  const file = formData.get("file") as File | null;

  if (!token || !file) {
    return NextResponse.json({ error: "الرابط والملف مطلوبان" }, { status: 400 });
  }
  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
    return NextResponse.json({ error: "نوع المستند غير معروف" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "حجم الملف أكبر من 10MB" }, { status: 400 });
  }

  const resolved = await resolveOnboardingProfile(token, EDITABLE_STATUSES);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const head = new Uint8Array(buffer.subarray(0, 8));
  const looksPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") || isPdfMagic(head);
  if (!looksPdf || !isPdfMagic(head)) {
    return NextResponse.json({ error: "نوع الملف غير مسموح — ارفع ملف PDF فقط" }, { status: 400 });
  }

  try {
    const checksum = createHash("sha256").update(buffer).digest("hex");
    const docId = await createSupplierDocument({
      profileId: resolved.profileId,
      documentType,
      fileName: file.name,
      base64Data: buffer.toString("base64"),
      mimeType: "application/pdf",
      fileSize: file.size,
      checksumSha256: checksum,
    });
    return NextResponse.json({ ok: true, document_id: docId });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[vendors/documents][${error.correlationId}] ${error.kind}: ${error.message}`);
    } else {
      console.error("Vendor document upload failed (unexpected):", error);
    }
    return NextResponse.json({ error: "تعذر رفع المستند — حاول مرة أخرى" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "رمز الدعوة مطلوب" }, { status: 400 });

  const resolved = await resolveOnboardingProfile(token, EDITABLE_STATUSES);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const documents = await listSupplierDocuments(resolved.profileId);
    return NextResponse.json({
      ok: true,
      documents: documents.map((d) => ({
        document_type: d.x_studio_document_type,
        file_name: d.x_studio_file_name,
        uploaded_at: d.x_studio_uploaded_at || null,
        verification_status: d.x_studio_verification_status,
      })),
    });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[vendors/documents][${error.correlationId}] ${error.kind}: ${error.message}`);
    }
    return NextResponse.json({ error: "تعذر جلب المستندات" }, { status: 500 });
  }
}
