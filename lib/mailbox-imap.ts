import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { processQuoteReply } from "@/lib/quote-intake";

type MailboxKind = "supplier" | "freight";

const MAILBOX_CONFIG: Record<MailboxKind, { userEnv: string; passEnv: string }> = {
  supplier: { userEnv: "ZOHO_SUPPLIER_IMAP_USER", passEnv: "ZOHO_SUPPLIER_IMAP_PASSWORD" },
  freight: { userEnv: "ZOHO_OPERATIONS_IMAP_USER", passEnv: "ZOHO_OPERATIONS_IMAP_PASSWORD" },
};

// يطابق سطر الموضوع الأصلي لرسائل RFQ الصادرة — يستخرج رقم التتبع رغم أي بادئة رد (Re:/RE:/رد:) تضيفها برامج البريد
const TRACKING_NUMBER_PATTERN = /(BLD-\d{6}-[A-Z0-9]+)/i;

export type MailboxPollResult = {
  kind: MailboxKind;
  scanned: number;
  processed: number;
  skipped: number;
  errors: number;
};

/** يفحص صندوق بريد وارد واحد (مورد أو شحن) عن ردود RFQ غير مقروءة، ويحوّلها لعروض أسعار منظَّمة عبر processQuoteReply — يعلّم كل رسالة كمقروءة بعد المعالجة (نجحت أو فشلت) لتفادي إعادة المعالجة */
export async function pollQuoteMailbox(kind: MailboxKind): Promise<MailboxPollResult> {
  const config = MAILBOX_CONFIG[kind];
  const user = process.env[config.userEnv];
  const pass = process.env[config.passEnv];
  const result: MailboxPollResult = { kind, scanned: 0, processed: 0, skipped: 0, errors: 0 };

  if (!user || !pass) return result;

  const client = new ImapFlow({
    host: "imap.zoho.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false }, { uid: true });
      if (!uids || !uids.length) return result;

      for (const uid of uids) {
        result.scanned += 1;
        try {
          const message = await client.fetchOne(uid, { source: true }, { uid: true });
          if (!message || !message.source) {
            result.skipped += 1;
            continue;
          }
          const parsed = await simpleParser(message.source);
          const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase().trim();
          const subject = parsed.subject || "";
          const bodyText = (parsed.text || "").trim();
          const trackingMatch = subject.match(TRACKING_NUMBER_PATTERN);

          if (!fromEmail || !trackingMatch || !bodyText) {
            result.skipped += 1;
            await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
            continue;
          }

          const outcome = await processQuoteReply({ trackingNumber: trackingMatch[1], email: fromEmail, rawText: bodyText });
          if (outcome.ok) {
            result.processed += 1;
          } else {
            result.skipped += 1;
            console.error(`[mailbox-imap:${kind}] skipped uid ${uid}: ${outcome.reason}`);
          }
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
        } catch (error) {
          result.errors += 1;
          console.error(`[mailbox-imap:${kind}] failed to process uid ${uid}:`, error instanceof Error ? error.message : error);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }

  return result;
}
