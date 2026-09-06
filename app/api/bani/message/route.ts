import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { BaniExtractionSchema, type BaniExtraction } from "@/lib/bani/extraction";

export const dynamic = "force-dynamic";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const EXTRACTION_MARKER = "BANI_EXTRACTION:";

const LANGUAGE_NAMES: Record<string, string> = {
  ar: "العربية",
  en: "English",
  zh: "中文",
  ur: "اردو",
};

function buildSystemPrompt(languageName: string): string {
  return `أنت "باني" ✦، مساعد ذكي ودود يعمل لصالح منصة "بيلد" (Build) — سوق مشتريات مواد بناء للأعمال في السعودية. مهمتك مساعدة مورد جديد يريد التسجيل في المنصة عبر محادثة قصيرة طبيعية بدل فورم طويل.

اجمع بأسلوب محادثة (سؤال أو سؤالين بحد أقصى بكل رد، لا تسرد كل الأسئلة دفعة وحدة):
- اسم المنشأة أو الشركة
- الدولة التي تتواجد فيها المنشأة
- نوع النشاط: مُصنّع (manufacturer)، موزع معتمد (authorized_distributor)، موزع (distributor)، مستورد (importer)، مصدّر (exporter)، تاجر (trader)، أو مزود خدمة (service_provider) — استنتج القيمة الإنجليزية الأقرب من كلام المستخدم، لا تسأله يختار من قائمة تقنية بالإنجليزي.
- وصف مختصر لأهم المنتجات أو المواد التي يوفرونها
- (اختياري) أسماء علامات تجارية يمثلونها أو يوزعونها، بالإنجليزي

قواعد:
- تحدث بلغة ${languageName} فقط طوال المحادثة، بغض النظر عن أي شيء آخر.
- إن كانت اللغة العربية: استخدم عربية فصحى واضحة ومهنية (لغة أعمال)، لا لهجة عامية أو كلمات مثل "تشكرات" أو "يعطيك العافية" أو ما شابه — هذا تسجيل رسمي لمنشأة تجارية، ليس دردشة عادية.
- كن مختصراً ومباشراً، بلا حشو ولا تكرار ترحيب.
- لا تخترع معلومات لم يذكرها المستخدم.
- إذا سأل سؤالاً غير متعلق بالتسجيل (مثل "من أنت")، جاوب بإيجاز عن هويتك كمساعد تسجيل، ثم ارجع لآخر معلومة كنت تسأل عنها — لا تتجاهل سؤاله وتقفز لسؤال غير مرتبط بما قاله.
- بعد ما يتوفر لديك على الأقل: اسم المنشأة، الدولة، نوع النشاط، ووصف مختصر — أخبر المستخدم أن معك معلومات كافية وأنه يقدر يراجعها ويكمل التسجيل عبر الفورم.

في نهاية كل رد فقط (سطر أخير لن يظهر للمستخدم — يُحذف قبل العرض)، إن كانت لديك أي معلومة جديدة عن ما سبق (حتى لو غير مكتملة)، أضف سطراً جديداً يبدأ بالضبط بـ ${EXTRACTION_MARKER} متبوعاً بكائن JSON بهذا الشكل فقط (null للحقول غير المعروفة بعد):
{"establishmentName": string|null, "country": string|null, "businessType": "manufacturer"|"authorized_distributor"|"distributor"|"importer"|"exporter"|"trader"|"service_provider"|null, "shortDescription": string|null, "brands": string[], "readyToHandOff": boolean}
لا تضف هذا السطر إن لم تتغيّر أي معلومة عن الرد السابق. لا تشرح هذا الـJSON للمستخدم إطلاقاً ولا تذكره في نص ردك المرئي.`;
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  language: z.enum(["ar", "en", "zh", "ur"]),
});

function parseReply(raw: string): { reply: string; extraction: BaniExtraction | null } {
  const markerIdx = raw.indexOf(EXTRACTION_MARKER);
  if (markerIdx === -1) return { reply: raw.trim(), extraction: null };

  const reply = raw.slice(0, markerIdx).trim();
  const jsonPart = raw.slice(markerIdx + EXTRACTION_MARKER.length).trim();
  try {
    const parsed = BaniExtractionSchema.safeParse(JSON.parse(jsonPart));
    return { reply, extraction: parsed.success ? parsed.data : null };
  } catch {
    return { reply, extraction: null };
  }
}

const FALLBACK_MESSAGE: Record<string, string> = {
  ar: "تعذر عليّ الرد الآن — تقدر تكمل التسجيل مباشرة عبر الفورم اليدوي بالأسفل.",
  en: "I couldn't reply right now — you can continue registration directly via the manual form below.",
  zh: "我现在无法回复——您可以直接通过下方的手动表格继续注册。",
  ur: "میں ابھی جواب نہیں دے سکا — آپ نیچے دیے گئے دستی فارم کے ذریعے براہ راست رجسٹریشن جاری رکھ سکتے ہیں۔",
};

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "chat");
  if (!ok) return rateLimitError(resetAt, "محادثة باني");

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });
  }
  const { messages, language } = parsed.data;

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("[bani/message] DEEPSEEK_API_KEY is not configured");
    return NextResponse.json({ reply: FALLBACK_MESSAGE[language], extraction: null });
  }

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        max_tokens: 4000,
        messages: [
          { role: "system", content: buildSystemPrompt(LANGUAGE_NAMES[language]) },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("DeepSeek returned no content");

    const { reply, extraction } = parseReply(rawContent);
    if (!reply) throw new Error("DeepSeek returned an empty reply");

    return NextResponse.json({ reply, extraction });
  } catch (error) {
    console.error("[bani/message] failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ reply: FALLBACK_MESSAGE[language], extraction: null });
  }
}
