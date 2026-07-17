import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OdooClientError, getOnboardingDraft, saveOnboardingDraft } from "@/lib/odoo";
import { resolveOnboardingProfile } from "@/lib/vendor-onboarding-guard";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

const EDITABLE_STATUSES = new Set(["completing_profile", "more_information_required"]);

const draftSchema = z.object({
  onboarding_token: z.string().min(10),
  draft: z.record(z.string(), z.unknown()),
});

export async function PUT(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "api");
  if (!ok) return rateLimitError(resetAt, "حفظ المسودة");

  const parsed = draftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات المسودة غير صحيحة" }, { status: 400 });
  }

  const resolved = await resolveOnboardingProfile(parsed.data.onboarding_token, EDITABLE_STATUSES, "carrier");
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    await saveOnboardingDraft("carrier", resolved.profileId, parsed.data.draft);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[carriers/draft][${error.correlationId}] ${error.kind}: ${error.message}`);
    }
    return NextResponse.json({ error: "تعذر حفظ المسودة" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "رمز الدعوة مطلوب" }, { status: 400 });

  const resolved = await resolveOnboardingProfile(
    token,
    new Set(["completing_profile", "more_information_required", "profile_completed"]),
    "carrier"
  );
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const draft = await getOnboardingDraft("carrier", resolved.profileId);
    return NextResponse.json({ ok: true, draft: draft || null });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[carriers/draft][${error.correlationId}] ${error.kind}: ${error.message}`);
    }
    return NextResponse.json({ error: "تعذر جلب المسودة" }, { status: 500 });
  }
}
