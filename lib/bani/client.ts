import type { BaniLanguage, BaniMessage } from "@/lib/bani/types";
import type { BaniExtraction } from "@/lib/bani/extraction";
import type { BaniPickedFile } from "@/components/bani/BaniComposer";

export type BaniReply = { reply: string; extraction: BaniExtraction | null };

/** Calls the real DeepSeek-backed /api/bani/message route with the full conversation so far.
 * attachment (if present) is only ever the file picked for this turn — its extracted text is
 * folded server-side into this one request, not persisted as part of the stored message history. */
export async function sendBaniMessage(history: BaniMessage[], language: BaniLanguage, attachment?: BaniPickedFile): Promise<BaniReply> {
  const res = await fetch("/api/bani/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      language,
      attachment: attachment ? { name: attachment.name, mimeType: attachment.mimeType, base64Data: attachment.base64Data } : undefined,
    }),
  });

  if (!res.ok) {
    return { reply: "تعذر الاتصال بباني الآن — تقدر تكمل التسجيل مباشرة عبر الفورم اليدوي بالأسفل.", extraction: null };
  }

  const data = (await res.json()) as Partial<BaniReply>;
  return { reply: data.reply ?? "", extraction: data.extraction ?? null };
}
