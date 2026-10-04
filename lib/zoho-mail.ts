/**
 * عميل Zoho Mail API (OAuth refresh-token) — لقراءة ردود الموردين على RFQ من صندوق partners@build.sa.
 * بديل عن IMAP (معطّل في خطة Zoho الحالية) وعن Resend inbound. يُستخدم من cron فقط.
 *
 * متغيّرات البيئة المطلوبة:
 *   ZOHO_MAIL_CLIENT_ID, ZOHO_MAIL_CLIENT_SECRET, ZOHO_MAIL_REFRESH_TOKEN, ZOHO_MAIL_ACCOUNT_ID
 * اختيارية:
 *   ZOHO_MAIL_INBOX_FOLDER_ID (يُجلب تلقائياً إن غاب)، ZOHO_ACCOUNTS_HOST (افتراضي accounts.zoho.com)،
 *   ZOHO_MAIL_HOST (افتراضي mail.zoho.com)
 */

export function isZohoMailConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_MAIL_CLIENT_ID &&
      process.env.ZOHO_MAIL_CLIENT_SECRET &&
      process.env.ZOHO_MAIL_REFRESH_TOKEN &&
      process.env.ZOHO_MAIL_ACCOUNT_ID
  );
}

const ACCOUNTS_HOST = () => (process.env.ZOHO_ACCOUNTS_HOST || "https://accounts.zoho.com").replace(/\/$/, "");
const MAIL_HOST = () => (process.env.ZOHO_MAIL_HOST || "https://mail.zoho.com").replace(/\/$/, "");
const ACCOUNT_ID = () => process.env.ZOHO_MAIL_ACCOUNT_ID!;

export type ZohoEmail = {
  messageId: string;
  folderId: string;
  subject: string;
  fromAddress: string;
};

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_MAIL_REFRESH_TOKEN!,
    client_id: process.env.ZOHO_MAIL_CLIENT_ID!,
    client_secret: process.env.ZOHO_MAIL_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${ACCOUNTS_HOST()}/oauth/v2/token?${params.toString()}`, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Zoho token refresh failed: HTTP ${res.status}`);
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!body.access_token) throw new Error(`Zoho token refresh: ${body.error || "no access_token"}`);
  return body.access_token;
}

async function zohoGet(token: string, path: string): Promise<Response> {
  return fetch(`${MAIL_HOST()}${path}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
}

async function resolveInboxFolderId(token: string): Promise<string> {
  if (process.env.ZOHO_MAIL_INBOX_FOLDER_ID) return process.env.ZOHO_MAIL_INBOX_FOLDER_ID;
  const res = await zohoGet(token, `/api/accounts/${ACCOUNT_ID()}/folders?fields=folderId,folderType`);
  if (!res.ok) throw new Error(`Zoho folders: HTTP ${res.status}`);
  const body = (await res.json()) as { data?: { folderId: string; folderType: string }[] };
  const inbox = (body.data || []).find((f) => f.folderType === "Inbox");
  if (!inbox) throw new Error("Zoho Inbox folder not found");
  return inbox.folderId;
}

/** يسرد الرسائل غير المقروءة في الوارد */
export async function listUnreadInbox(limit = 50): Promise<ZohoEmail[]> {
  const token = await getAccessToken();
  const folderId = await resolveInboxFolderId(token);
  const res = await zohoGet(
    token,
    `/api/accounts/${ACCOUNT_ID()}/messages/view?folderId=${encodeURIComponent(folderId)}&status=unread&limit=${limit}&fields=messageId,folderId,subject,fromAddress`
  );
  if (!res.ok) throw new Error(`Zoho list: HTTP ${res.status}`);
  const body = (await res.json()) as { data?: { messageId: string; folderId: string; subject?: string; fromAddress?: string }[] };
  return (body.data || []).map((m) => ({
    messageId: String(m.messageId),
    folderId: String(m.folderId),
    subject: m.subject || "",
    fromAddress: m.fromAddress || "",
  }));
}

/** محتوى الرسالة كنص (يُجرّد HTML) */
export async function getMessageText(folderId: string, messageId: string): Promise<string> {
  const token = await getAccessToken();
  const res = await zohoGet(token, `/api/accounts/${ACCOUNT_ID()}/folders/${encodeURIComponent(folderId)}/messages/${encodeURIComponent(messageId)}/content`);
  if (!res.ok) throw new Error(`Zoho content: HTTP ${res.status}`);
  const body = (await res.json()) as { data?: { content?: string } };
  const html = body.data?.content || "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** يعلّم الرسالة كمقروءة حتى لا تُعالَج مرة أخرى */
export async function markRead(messageId: string): Promise<void> {
  const token = await getAccessToken();
  await fetch(`${MAIL_HOST()}/api/accounts/${ACCOUNT_ID()}/updatemessage`, {
    method: "PUT",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "markAsRead", messageId: [messageId] }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => undefined);
}

/** يستخرج عنوان المرسِل الفعلي من حقل fromAddress (قد يكون "Name <a@b.com>") */
export function extractSender(fromAddress: string): string {
  const m = fromAddress.match(/<([^>]+)>/);
  return (m ? m[1] : fromAddress).trim().toLowerCase();
}
