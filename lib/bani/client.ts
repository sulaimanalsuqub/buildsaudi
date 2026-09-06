import type { BaniLanguage, BaniMessage } from "@/lib/bani/types";
import type { BaniExtraction } from "@/lib/bani/extraction";

export type BaniReply = { reply: string; extraction: BaniExtraction | null };

/** Calls the real DeepSeek-backed /api/bani/message route with the full conversation so far. */
export async function sendBaniMessage(history: BaniMessage[], language: BaniLanguage): Promise<BaniReply> {
  const res = await fetch("/api/bani/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      language,
    }),
  });

  if (!res.ok) {
    return { reply: "تعذر الاتصال بباني الآن — تقدر تكمل التسجيل مباشرة عبر الفورم اليدوي بالأسفل.", extraction: null };
  }

  const data = (await res.json()) as Partial<BaniReply>;
  return { reply: data.reply ?? "", extraction: data.extraction ?? null };
}
