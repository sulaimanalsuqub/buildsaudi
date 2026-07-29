import { Resend } from "resend";
import { PDFParse } from "pdf-parse";

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

/** Extract only real PDF attachments. Spreadsheets remain deliberately unsupported. */
async function retrieveInboundPdfText(emailId: string, attachments: RetrievedInboundEmail["attachments"]): Promise<string> {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const parts: string[] = [];
  for (const attachment of attachments) {
    if (attachment.content_type.toLowerCase().split(";")[0] !== "application/pdf" || attachment.size <= 0 || attachment.size > 8 * 1024 * 1024) continue;
    const signed = await resend.emails.receiving.attachments.get({ emailId, id: attachment.id });
    if (signed.error || !signed.data?.download_url) throw new Error(`Resend attachment lookup failed: ${signed.error?.message || "empty response"}`);
    const response = await fetch(signed.data.download_url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Resend attachment download failed: ${response.status}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 8 * 1024 * 1024) throw new Error("Inbound PDF exceeds size limit");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 8 * 1024 * 1024 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") continue;
    const parser = new PDFParse({ data: bytes });
    try {
      const text = (await parser.getText()).text?.trim();
      if (text) parts.push(`مرفق PDF (${attachment.filename || "quotation.pdf"}):\n${text.slice(0, 60_000)}`);
    } catch {
      // A valid but non-text PDF stays linked to the RFQ through the received email;
      // caller routes it to operations review instead of inventing a quote.
    } finally { await parser.destroy(); }
  }
  return parts.join("\n\n---\n\n");
}

/**
 * Resend لا يضع جسم الرسالة في webhook؛ يجلبه عبر email_id.
 * إبقاء fallback للـtext/html يجعل الاختبار المحلي والتوافق مع providers القديمة آمنين.
 */
export async function resolveInboundContent(
  data: InboundWebhookData,
  retrieve: (emailId: string) => Promise<RetrievedInboundEmail> = retrieveInboundEmail
): Promise<{ text: string; attachmentCount: number; attachmentText: string }> {
  const inlineText =
    typeof data.text === "string" && data.text.trim()
      ? data.text.trim()
      : typeof data.html === "string" && data.html.trim()
        ? stripInboundHtml(data.html)
        : "";
  if (inlineText) {
    return {
      text: inlineText,
      attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0, attachmentText: "",
    };
  }

  if (typeof data.email_id !== "string" || !data.email_id.trim()) {
    return { text: "", attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0, attachmentText: "" };
  }

  const email = await retrieve(data.email_id);
  const text = email.text?.trim() || (email.html ? stripInboundHtml(email.html) : "");
  // Test/local injected retrieval has no Resend attachment client. Production's
  // default path retrieves the signed attachment URLs after the email body.
  const attachmentText = retrieve === retrieveInboundEmail ? await retrieveInboundPdfText(data.email_id, email.attachments) : "";
  return { text, attachmentCount: email.attachments.length, attachmentText };
}
