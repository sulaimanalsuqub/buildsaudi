import { z } from "zod";

const QuoteLineSchema = z.object({
  itemName: z.string(),
  unitPrice: z.number().nullable().optional(),
  quantity: z.number().nullable().optional(),
  available: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const QuoteExtractionSchema = z.object({
  totalPrice: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  leadTimeDays: z.number().nullable().optional(),
  validityDays: z.number().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  includesDelivery: z.boolean().nullable().optional(),
  includesTax: z.boolean().nullable().optional(),
  confidence: z.number(),
  lines: z.array(QuoteLineSchema).default([]),
});

export type ExtractedQuote = z.infer<typeof QuoteExtractionSchema>;

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const SYSTEM_PROMPT = `أنت خبير مشتريات متمرس في سوق مواد البناء بالسعودية والخليج. مهمتك: قراءة رد مورد أو ناقل على طلب عرض سعر (RFQ) واستخلاص بيانات العرض منه بدقة.

استخلص:
- totalPrice: السعر الإجمالي للعرض إن ذُكر رقماً صريحاً (بدون رمز العملة).
- currency: رمز العملة كما وردت (مثال: SAR، ريال). افتراضي "SAR" إن لم تُذكر صراحة لكن السياق سعودي واضح.
- leadTimeDays: مدة التجهيز/التسليم بالأيام (حوّل الأسابيع/الأشهر المذكورة إلى أيام تقريبية).
- validityDays: مدة صلاحية العرض بالأيام.
- paymentTerms: شروط الدفع كما وردت نصاً (مثال: "50% مقدم والباقي عند التسليم").
- includesDelivery: هل السعر يشمل التوصيل؟ (true/false فقط إن ذُكر صراحة، وإلا اتركه فارغاً).
- includesTax: هل السعر يشمل ضريبة القيمة المضافة؟ (نفس القاعدة).
- lines: بنود العرض إن فصّل المورد السعر لكل صنف على حدة (itemName، unitPrice، quantity، available: هل الصنف متوفر أم لا، notes: أي ملاحظة على الصنف مثل بديل مقترح). إن كان السعر إجمالياً فقط بلا تفصيل، أرجع lines فارغة.
- confidence: 0 إلى 1 — منخفضة إن كان النص غامضاً أو لا يحتوي عرض سعر واضح فعلاً (قد يكون استفسار أو رفض أو رسالة غير متعلقة).

لا تخترع أرقاماً أو شروطاً غير مذكورة أو غير قابلة للاستنتاج المباشر من النص.

أخرج JSON فقط بالشكل التالي بالضبط:
{"totalPrice": 0, "currency": "string?", "leadTimeDays": 0, "validityDays": 0, "paymentTerms": "string?", "includesDelivery": true, "includesTax": true, "confidence": 0, "lines": [{"itemName": "string", "unitPrice": 0, "quantity": 0, "available": true, "notes": "string?"}]}
الحقول المنتهية بـ"?" اختيارية — احذفها إن لم تنطبق. إن لم يكن النص عرض سعر فعلي (استفسار/رفض/غير ذي صلة)، أرجع confidence منخفضة جداً (أقل من 0.2) وlines فارغة والحقول الرقمية null.`;

/** يستخلص بيانات عرض سعر من نص رد المورد/الناقل الحر عبر DeepSeek — يعيد null عند غياب المفتاح أو فشل الطلب أو نص فارغ */
export async function extractQuoteFromReply(rawText: string): Promise<ExtractedQuote | null> {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed.slice(0, 20_000) },
        ],
      }),
    });

    if (!res.ok) {
      console.error("[quote-extraction] DeepSeek API error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsed = QuoteExtractionSchema.safeParse(JSON.parse(rawContent));
    if (!parsed.success) {
      console.error("[quote-extraction] DeepSeek output failed schema validation:", parsed.error.message);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error("[quote-extraction] failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
