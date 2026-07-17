import { NextRequest, NextResponse } from "next/server";
import { OdooClientError, getOnboardingDraft, read, write } from "@/lib/odoo";
import { resolveOnboardingProfile } from "@/lib/vendor-onboarding-guard";

const ALLOWED_ENTRY_STATUSES = new Set([
  "preliminary_approved",
  "completing_profile",
  "more_information_required",
  "profile_completed",
]);

type ProfileRow = {
  id: number;
  x_studio_carrier_type: string;
  x_studio_country_name: string | false;
  x_studio_short_description: string | false;
  x_studio_service_area_ids: number[];
  x_studio_vehicle_type_ids: number[];
  x_studio_material_category_ids: number[];
  x_studio_partner_id: [number, string] | false;
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "رمز الدعوة مطلوب" }, { status: 400 });
  }

  const resolved = await resolveOnboardingProfile(token, ALLOWED_ENTRY_STATUSES, "carrier");
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { profileId, status } = resolved;

  try {
    const rows = await read<ProfileRow>("x_build_carrier_profile", [profileId], [
      "x_studio_carrier_type",
      "x_studio_country_name",
      "x_studio_short_description",
      "x_studio_service_area_ids",
      "x_studio_vehicle_type_ids",
      "x_studio_material_category_ids",
      "x_studio_partner_id",
    ]);
    const profile = rows[0];
    if (!profile) {
      return NextResponse.json({ error: "رابط الدعوة غير صالح أو منتهي الصلاحية" }, { status: 401 });
    }

    const readOnly = status === "profile_completed";

    let effectiveStatus = status;
    if (status === "preliminary_approved") {
      effectiveStatus = "completing_profile";
      await write("x_build_carrier_profile", [profileId], {
        x_studio_status: effectiveStatus,
        x_studio_last_onboarding_opened_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        x_studio_onboarding_open_count: 1,
      });
    }

    const draft = await getOnboardingDraft("carrier", profileId);

    return NextResponse.json({
      ok: true,
      profile_id: profileId,
      establishment_name: profile.x_studio_partner_id ? profile.x_studio_partner_id[1] : "",
      carrier_type: profile.x_studio_carrier_type,
      country: profile.x_studio_country_name || "",
      short_description: profile.x_studio_short_description || "",
      service_area_ids: profile.x_studio_service_area_ids || [],
      vehicle_type_ids: profile.x_studio_vehicle_type_ids || [],
      category_ids: profile.x_studio_material_category_ids || [],
      status: effectiveStatus,
      read_only: readOnly,
      draft: draft || null,
    });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[carriers/onboarding][${error.correlationId}] ${error.kind}: ${error.message}`);
      return NextResponse.json({ error: "تعذر الوصول لبيانات الملف حالياً" }, { status: 500 });
    }
    console.error("Carrier onboarding lookup failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر الوصول لبيانات الملف حالياً" }, { status: 500 });
  }
}
