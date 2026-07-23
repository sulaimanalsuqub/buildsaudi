import { PDFParse } from "pdf-parse";
import { z } from "zod";
import * as XLSX from "xlsx";

const ExtractedItemSchema = z.object({
  itemName: z.string(),
  originalText: z.string(),
  quantity: z.number(),
  unit: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  countryOfOrigin: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subCategory: z.string().nullable().optional(),
  modelNumber: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  confidence: z.number(),
});

const ExtractionResultSchema = z.object({ items: z.array(ExtractedItemSchema) });

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type SourceFile = { name: string; mimeType: string; base64Data: string };

function buildSystemPrompt(allowedCategories: string[], existingCatalogNames: string[] = []): string {
  const categoryList = allowedCategories.length ? allowedCategories.map((c) => `"${c}"`).join("، ") : null;
  const categoryRule = categoryList
    ? `category: اختر **حصراً** واحدة من هذه الفئات المسجَّلة فعلياً في النظام (انسخ الاسم حرفياً كما هو، بدون أي تعديل): ${categoryList}. لا تخترع فئة غير موجودة بهذي القائمة مهما كان الصنف؛ اختر الأقرب معنى. subCategory حر (تفصيل داخل الفئة، مثل نوع/استخدام الصنف تحديداً).`
    : `category / subCategory: تصنيف تجاري متّسق بالعربية — استخدم نفس التصنيف لعناصر متشابهة داخل نفس الطلب، لا فئات مخصصة لكل صنف على حدة.`;

  const catalogList = existingCatalogNames.length ? existingCatalogNames.map((n) => `"${n}"`).join("، ") : null;
  const catalogRule = catalogList
    ? `\n\nأصناف مسجَّلة فعلاً بكتالوج النظام حالياً (من طلبات سابقة): ${catalogList}\nإن كان الصنف المستخرج **هو نفسه** أحد هذي الأصناف (نفس المنتج بالضبط، ولو صيغة العميل مختلفة شوي)، استخدم itemName **بنفس الاسم المسجَّل حرفياً** بدل صياغة اسم جديد — هذا يمنع تكرار نفس الصنف بأسماء مختلفة بالكتالوج. لا تجبر التطابق إن كان الصنف فعلاً مختلفاً.`
    : "";

  return `أنت خبير مشتريات ومقاولات متمرس جداً في سوق مواد البناء بالسعودية والخليج — قضيت سنوات تراجع كشوفات كميات (BOQ) وفواتير موردين وطلبات مقاولين، وتعرف المصطلحات الفنية بالفصحى واللهجة السعودية/الخليجية الدارجة المستخدمة فعلياً في مستندات المقاولين، ومختصرات الصناعة الشائعة (PPR, UPVC, PVC, GI, DN, NB, HDPE, MDF...).

مهمتك: استخلاص بنود مواد بناء من مصدر (وصف حر بالعربية/الإنجليزية، و/أو نص مستخرج من ملف مرفق PDF أو جدول بيانات Excel/CSV يمثّل BOQ أو قائمة مواد).

لكل صنف استخرج:
- itemName: اسم الصنف المحدد فقط، **بصيغة المفرد دائماً** (يمثّل وحدة واحدة من المنتج — الكمية بحقل quantity والوحدة بحقل unit منفصلين). لا تبدأ itemName أبداً برقم أو بوحدة قياس (مثال صحيح: "اسمنت مقاوم للكبريتات" — خطأ: "كيس اسمنت مقاوم للكبريتات" أو "50 كيس اسمنت..."؛ مثال صحيح: "حديد تسليح" — خطأ: "متر حديد تسليح"). تجاهل كلمات حشو مثل "توريد"/"حسب العينة"/"تركيب" عند تكوين الاسم، لكن حافظ على المواصفات المميِّزة (المقاس، المادة، الدرجة) داخل الاسم أو حقل specifications.${catalogRule}
- originalText: انسخ حرفياً السطر/الصف الذي استُخرج منه هذا الصنف تحديداً — بصيغته الأصلية كاملة دون أي تعديل أو تلخيص، خاص بهذا الصنف وحده لا نصاً عاماً عن الملف.
- quantity: رقم عددي صافٍ. حوّل الأرقام العربية الهندية (٠-٩) والكسور المكتوبة (1/2, 3/4, 1 1/4) إلى قيمة رقمية عشرية عادية.
- unit: وحدة القياس كما تُستخدم فعلياً بالسوق (حبة، متر، متر مربع، متر مكعب، كجم، لتر، لفة، طقم، دستة، علبة، كرتون...) — طبيعية غير حرفية الترجمة.
- brand: العلامة التجارية فقط إن ذُكرت صراحة — لا تخلطها بالمادة أو المواصفة (مثلاً "ستانلس ستيل" مادة وليست علامة تجارية).
- ${categoryRule}
- modelNumber / specifications: فقط إن وردت أو أمكن استنتاجها بوضوح.
- confidence: 0 إلى 1 — اجعلها منخفضة (أقل من 0.6) عند نص غامض أو استنتاج غير مباشر؛ وعالية (0.9+) فقط عند وضوح تام في المصدر.

قواعد أساسية:
- لا تخترع أصنافاً أو كميات أو مواصفات غير مذكورة أو غير قابلة للاستنتاج المباشر من المصدر.
- عند قراءة جدول: تجاهل صفوف العناوين/الإجماليات/الملاحظات الهامشية، واستخرج فقط صفوف البنود الفعلية. لا تكرر نفس الصنف مرتين لمجرد اختلاف رقم السطر.
- إن لم يتضمن المصدر أي صنف مادي واضح، أرجع مصفوفة أصناف فارغة.

أخرج النتيجة بصيغة JSON فقط، بدون أي نص أو شرح خارج الـJSON، بالشكل التالي بالضبط:
{"items": [{"itemName": "string", "originalText": "string", "quantity": 0, "unit": "string?", "brand": "string?", "countryOfOrigin": "string?", "category": "string?", "subCategory": "string?", "modelNumber": "string?", "specifications": "string?", "confidence": 0}]}
الحقول المنتهية بـ"?" اختيارية — احذفها إن لم تنطبق بدل إرجاع قيمة فارغة. إن لم يوجد أي صنف، أرجع {"items": []}.`;
}

const SPREADSHEET_EXTENSION_PATTERN = /\.(xlsx|xls|csv)$/i;
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// شبكة أمان: DeepSeek لا يلتزم دائماً بتعليمة "اختر حصراً من هذه القائمة" (نموذج أضعف من Claude بالالتزام).
// خريطة مرادفات ثابتة تُطبَّع بها أي فئة حرة يرجعها النموذج إلى إحدى الفئات الفعّالة الثمانية في أودو.
const CATEGORY_SYNONYMS: Record<string, string> = {
  "أدوات صحية": "الأدوات الصحية وتجهيزات الحمامات",
  "أجهزة صحية": "الأدوات الصحية وتجهيزات الحمامات",
  "تجهيزات حمامات": "الأدوات الصحية وتجهيزات الحمامات",
  "كهرباء وإنارة": "الكهرباء والإنارة",
  "كهرباء": "الكهرباء والإنارة",
  "إنارة": "الكهرباء والإنارة",
  "أجهزة كهربائية": "الكهرباء والإنارة",
  "سباكة وأنابيب": "السباكة وأنظمة الأنابيب",
  "سباكة": "السباكة وأنظمة الأنابيب",
  "مواسير": "السباكة وأنظمة الأنابيب",
  "فلاتر مياه": "السباكة وأنظمة الأنابيب",
  "تكييف": "التكييف والتهوية",
  "تكييف وتبريد": "التكييف والتهوية",
  "تبريد": "التكييف والتهوية",
  "تهوية": "التكييف والتهوية",
  "أرضيات": "الأرضيات",
  "بلاط": "الأرضيات",
  "جداريات": "الجداريات",
  "تغطيات جدران": "الجداريات",
  "دهانات": "الدهانات الداخلية والخارجية",
  "طلاء": "الدهانات الداخلية والخارجية",
  "دهان": "الدهانات الداخلية والخارجية",
  "مواد لاصقة": "اللواصق والمواد المساعدة",
  "لواصق": "اللواصق والمواد المساعدة",
  "غراء": "اللواصق والمواد المساعدة",
};

/** يطبّع فئة حرة أرجعها النموذج إلى إحدى الفئات الفعّالة — تطابق حرفي أولاً، ثم خريطة مرادفات، وإلا يُترك كما هو */
function normalizeCategory(rawCategory: string | null | undefined, allowedCategories: string[]): string | null | undefined {
  if (!rawCategory || !allowedCategories.length) return rawCategory;
  if (allowedCategories.includes(rawCategory)) return rawCategory;
  const mapped = CATEGORY_SYNONYMS[rawCategory.trim()];
  return mapped && allowedCategories.includes(mapped) ? mapped : rawCategory;
}

/** يحوّل ورقة إكسل/CSV إلى نص CSV مقروء للنموذج — يتجاهل الأوراق الفارغة */
function spreadsheetToText(base64Data: string, fileName: string): string | null {
  try {
    const workbook = XLSX.read(base64Data, { type: "base64" });
    const parts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]).trim();
      if (csv) parts.push(`# ${sheetName}\n${csv}`);
    }
    if (!parts.length) return null;
    return `ملف: ${fileName}\n${parts.join("\n\n")}`.slice(0, 60_000);
  } catch {
    return null;
  }
}

/** يستخرج النص من PDF — لا يقرأ PDF ممسوح ضوئياً (صورة بلا طبقة نص)، لأن DeepSeek نصي فقط بلا رؤية */
async function pdfToText(base64Data: string, fileName: string): Promise<string | null> {
  const parser = new PDFParse({ data: Buffer.from(base64Data, "base64") });
  try {
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) return null;
    return `ملف (PDF): ${fileName}\n${text}`.slice(0, 60_000);
  } catch {
    return null;
  } finally {
    await parser.destroy();
  }
}

/** يبني نص المصدر المُجمَّع من الوصف الحر والملفات — الصور غير مدعومة (لا رؤية لدى DeepSeek)، تبقى مرفقة للمراجعة اليدوية فقط */
async function buildSourceText(description: string, files: SourceFile[]): Promise<string> {
  const parts: string[] = [];
  const trimmedDescription = description.trim();
  if (trimmedDescription) parts.push(trimmedDescription);

  for (const file of files) {
    if (file.mimeType === "application/pdf") {
      const text = await pdfToText(file.base64Data, file.name);
      if (text) parts.push(text);
    } else if (file.mimeType.includes("spreadsheet") || file.mimeType === "text/csv" || SPREADSHEET_EXTENSION_PATTERN.test(file.name)) {
      const text = spreadsheetToText(file.base64Data, file.name);
      if (text) parts.push(text);
    }
    // ملاحظة: ملفات الصور تُتجاهل هنا عمداً — DeepSeek نموذج نصي بلا رؤية، والصورة تبقى مرفقة بالطلب لمراجعة الفريق يدوياً فقط
  }

  return parts.join("\n\n---\n\n");
}

const MAX_CATALOG_NAMES_IN_PROMPT = 300;

/** يستخلص بنود مواد من وصف حر و/أو ملفات مرفقة (PDF نصي/Excel/CSV) عبر DeepSeek — يعيد مصفوفة فارغة عند غياب المفتاح أو فشل الطلب أو خلو المصدر من أصناف واضحة
 * allowedCategories: قائمة الفئات الفعّالة في أودو (Master Data) — يُقيَّد اختيار category بها حصراً لضمان تطابقها مع فئات الموردين المسجَّلين، لتفعيل اقتراح الموردين لاحقاً
 * existingCatalogNames: أسماء منتجات الكتالوج الحالية — تُمرَّر للنموذج ليعيد استخدام نفس الاسم بدل صياغة جديدة لنفس الصنف، لتقليل تكرار المنتجات بالكتالوج */
export async function extractRequestItems(
  description: string,
  files: SourceFile[] = [],
  allowedCategories: string[] = [],
  existingCatalogNames: string[] = []
): Promise<ExtractedItem[]> {
  if (!process.env.DEEPSEEK_API_KEY) return [];

  const sourceText = await buildSourceText(description, files);
  if (!sourceText.trim()) return [];

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(allowedCategories, existingCatalogNames.slice(0, MAX_CATALOG_NAMES_IN_PROMPT)) },
          { role: "user", content: sourceText },
        ],
      }),
    });

    if (!res.ok) {
      console.error("[material-extraction] DeepSeek API error:", res.status, await res.text().catch(() => ""));
      return [];
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) return [];

    const parsed = ExtractionResultSchema.safeParse(JSON.parse(rawContent));
    if (!parsed.success) {
      console.error("[material-extraction] DeepSeek output failed schema validation:", parsed.error.message);
      return [];
    }

    return parsed.data.items
      .filter((item) => item.itemName.trim().length > 0 && item.quantity > 0)
      .map((item) => ({ ...item, category: normalizeCategory(item.category, allowedCategories) }));
  } catch (error) {
    console.error("[material-extraction] failed:", error instanceof Error ? error.message : error);
    return [];
  }
}
