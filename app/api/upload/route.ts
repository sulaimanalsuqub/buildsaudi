import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

const FOLDERS = {
  boq: {
    requiresAuth: false,
    maxSize: 10 * 1024 * 1024,
    types: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ],
  },
  contracts: {
    requiresAuth: true,
    maxSize: 10 * 1024 * 1024,
    types: ["application/pdf"],
  },
  general: {
    requiresAuth: true,
    maxSize: 20 * 1024 * 1024,
    types: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/png",
      "image/jpeg",
      "text/csv",
    ],
  },
} as const;

type UploadFolder = keyof typeof FOLDERS;

function getUploadFolder(value: FormDataEntryValue | null): UploadFolder {
  return value === "boq" || value === "contracts" || value === "general" ? value : "general";
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const { ok, resetAt } = checkRateLimit(clientId, "api");
    if (!ok) return rateLimitError(resetAt, "upload");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = getUploadFolder(formData.get("folder"));
    const rules = FOLDERS[folder];

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
    }

    if (rules.requiresAuth) {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "يجب تسجيل الدخول لرفع الملفات" }, { status: 401 });
      }
    }

    if (file.size > rules.maxSize) {
      const maxMb = Math.floor(rules.maxSize / 1024 / 1024);
      return NextResponse.json({ error: `حجم الملف أكبر من ${maxMb}MB` }, { status: 400 });
    }

    if (!(rules.types as readonly string[]).includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مسموح" }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminSupabase.storage
      .from("documents")
      .upload(path, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
    }

    const { data: urlData } = adminSupabase.storage
      .from("documents")
      .getPublicUrl(path);

    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (e) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
