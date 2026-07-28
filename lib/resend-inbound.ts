import { Resend } from "resend";

export type InboundWebhookData = {
  email_id?: unknown;
  from?: unknown;
  subject?: unknown;
  text?: unknown;
  html?: unknown;
  attachments?: unknown;
};

export type RetrievedInboundEmail = {
  text: string | null;
  html: string | null;
  attachments: { id: string; filename: string | null; content_type: string; size: number }[];
};

/** يستخرج عنوان البريد من صيغ "Name <a@b.c>" أو العنوان المجرد. */
export function extractEmailAddress(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const angled = raw.match(/<([^>]+)>/);
  const candidate = (angled ? angled[1] : raw).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

/** تحويل HTML إلى نص للاستخلاص فقط؛ لا يُعرض HTML الوارد في الواجهة. */
export function stripInboundHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function retrieveInboundEmail(emailId: string): Promise<RetrievedInboundEmail> {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const result = await new Resend(process.env.RESEND_API_KEY).emails.receiving.get(emailId);
  if (result.error || !result.data) {
    throw new Error(`Resend received-email lookup failed: ${result.error?.message || "empty response"}`);
  }
  return {
    text: result.data.text,
    html: result.data.html,
    attachments: result.data.attachments,
  };
}

/**
 * Resend لا يضع جسم الرسالة في webhook؛ يجلبه عبر email_id.
 * إبقاء fallback للـtext/html يجعل الاختبار المحلي والتوافق مع providers القديمة آمنين.
 */
export async function resolveInboundContent(
  data: InboundWebhookData,
  retrieve: (emailId: string) => Promise<RetrievedInboundEmail> = retrieveInboundEmail
): Promise<{ text: string; attachmentCount: number }> {
  const inlineText =
    typeof data.text === "string" && data.text.trim()
      ? data.text.trim()
      : typeof data.html === "string" && data.html.trim()
        ? stripInboundHtml(data.html)
        : "";
  if (inlineText) {
    return {
      text: inlineText,
      attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0,
    };
  }

  if (typeof data.email_id !== "string" || !data.email_id.trim()) {
    return { text: "", attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0 };
  }

  const email = await retrieve(data.email_id);
  const text = email.text?.trim() || (email.html ? stripInboundHtml(email.html) : "");
  return { text, attachmentCount: email.attachments.length };
}
