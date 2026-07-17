import { read } from "@/lib/odoo";
import { verifyOnboardingTokenStructure } from "@/lib/vendor-onboarding-token";

export type ProfileGuardResult =
  | { ok: true; profileId: number; status: string }
  | { ok: false; error: string; status: number };

/** يتحقق من بنية/توقيع/انتهاء التوكن، ثم من مطابقة tokenVersion الحالي في Odoo، ثم من أن حالة الملف ضمن المسموح */
export async function resolveOnboardingProfile(
  token: string,
  allowedStatuses: Set<string>
): Promise<ProfileGuardResult> {
  const verification = verifyOnboardingTokenStructure(token);
  if (!verification.ok) {
    return { ok: false, error: "رابط الدعوة غير صالح أو منتهي الصلاحية", status: 401 };
  }

  const { profileId, tokenVersion } = verification.payload;
  const rows = await read<{ x_studio_status: string; x_studio_token_version: number | false }>(
    "x_build_supplier_profile",
    [profileId],
    ["x_studio_status", "x_studio_token_version"]
  );
  const profile = rows[0];
  if (!profile) {
    return { ok: false, error: "رابط الدعوة غير صالح أو منتهي الصلاحية", status: 401 };
  }
  if (tokenVersion !== (profile.x_studio_token_version || 1)) {
    return { ok: false, error: "رابط الدعوة غير صالح أو منتهي الصلاحية", status: 401 };
  }
  if (!allowedStatuses.has(profile.x_studio_status)) {
    return { ok: false, error: "لا يمكن تنفيذ هذا الإجراء في الحالة الحالية", status: 403 };
  }

  return { ok: true, profileId, status: profile.x_studio_status };
}
