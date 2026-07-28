const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** يتحقق من رمز Cloudflare Turnstile عبر الخادم قبل قبول أي إرسال عام */
export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // في الإنتاج: نفشل مغلقاً (نرفض) بدل تعطيل الحماية بصمت — سوء تهيئة يجب أن يظهر بوضوح لا أن يفتح ثغرة
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY missing in production — rejecting submission (fail-closed)");
      return false;
    }
    return true; // بيئة محلية/تطوير بلا مفتاح مُهيّأ — لا نحجب الإرسال
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
