import { hasStructuredBoqContent, parseBoqTableText } from "@/lib/boq-table-parser";

// ── Cache بسيط لتفادي استدعاء DeepSeek مرتين لنفس المحتوى ──────────────────
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 دقائق
const extractionCache = new Map<string, { result: ExtractedMaterialItem[]; expiresAt: number }>();

function hashInput(input: ExtractionInput): string {
  const key = [
    input.materials?.trim() ?? "",
    input.boq_file_text?.slice(0, 500) ?? "",
    input.boq_file_url ?? "",
    input.notes?.trim() ?? "",
  ].join("|");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = Math.imul(31, hash) + key.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export type ExtractedMaterialItem = {
  item_name: string;
  description: string;
  quantity: number;
  uom: string;
  category: string;
  specifications: string;
  confidence: number;
  source: "ai" | "fallback";
};

type ExtractionInput = {
  materials?: string;
  notes?: string;
  boq_file_url?: string | null;
  boq_file_text?: string;
};

const categoryKeywords = [
  { category: "مواد بناء وإنشاء", keywords: ["اسمنت", "أسمنت", "cement", "خرسانة", "بلوك", "حديد", "rebar"] },
  { category: "أدوات السلامة", keywords: ["سلامة", "helmet", "قفاز", "حذاء", "safety"] },
  { category: "دهانات وديكور", keywords: ["دهان", "طلاء", "paint", "جبس", "ديكور"] },
  { category: "كهرباء وإنارة", keywords: ["كهرب", "إنارة", "انارة", "كيبل", "كابل", "لمبة", "led", "cable"] },
  { category: "سباكة", keywords: ["سباكة", "محبس", "صمام", "valve", "خلاط"] },
  { category: "أدوات صحية", keywords: ["كرسي", "مغسلة", "خلاط", "sanitary"] },
  { category: "تكييف وتبريد", keywords: ["مكيف", "تكييف", "duct", "hvac", "تبريد"] },
  { category: "أنظمة الأنابيب", keywords: ["ماسورة", "أنبوب", "انبوب", "pipe", "pvc", "cpvc", "hdpe"] },
  { category: "مضخات وخزانات", keywords: ["مضخة", "خزان", "pump", "tank"] },
  { category: "أرضيات وسيراميك", keywords: ["سيراميك", "بلاط", "tile", "رخام", "أرضيات"] },
  { category: "عوازل", keywords: ["عازل", "عزل", "insulation", "waterproof"] },
  { category: "مواد لاصقة", keywords: ["لاصق", "غراء", "adhesive", "سيليكون"] },
];

function normalizeNumber(value: string) {
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function inferCategory(text: string) {
  const lowered = text.toLowerCase();
  return categoryKeywords.find(({ keywords }) => keywords.some((keyword) => lowered.includes(keyword.toLowerCase())))
    ?.category || "غير مصنف";
}

function cleanupLine(line: string) {
  return line
    .replace(/^[\s\-*•]+/, "")
    .replace(/^\d+[\).\-\s]+/, "")
    .trim();
}

function fallbackExtract(input: ExtractionInput): ExtractedMaterialItem[] {
  const sourceText = [input.boq_file_text, input.materials].filter(Boolean).join("\n");
  const candidates = sourceText
    .split(/\n|،|;/)
    .map(cleanupLine)
    .filter((line) => line.length >= 2)
    .slice(0, 20);

  if (!candidates.length) {
    return [{
      item_name: "طلب مواد",
      description: sourceText || "طلب مواد من العميل",
      quantity: 1,
      uom: "Nos",
      category: "غير مصنف",
      specifications: input.notes || "",
      confidence: 35,
      source: "fallback",
    }];
  }

  return candidates.map((line) => {
    const quantityMatch = line.match(/([٠-٩۰-۹\d]+(?:[.,][٠-٩۰-۹\d]+)?)\s*(طن|كجم|كيلو|متر|م²|م2|m2|m|mm|ملم|حبة|pcs|piece|bag|كيس|لفة|roll|nos)?/i);
    const quantity = quantityMatch ? normalizeNumber(quantityMatch[1].replace(",", ".")) : 1;
    const uom = quantityMatch?.[2] || "Nos";

    return {
      item_name: line.slice(0, 120),
      description: line,
      quantity,
      uom,
      category: inferCategory(line),
      specifications: "",
      confidence: quantityMatch ? 55 : 40,
      source: "fallback",
    };
  });
}

function extractOutputText(response: unknown) {
  const record = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (record.output_text) return record.output_text;

  return record.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text)
    .find((text): text is string => Boolean(text)) || "";
}

function normalizeItems(items: Array<Omit<ExtractedMaterialItem, "source">>, source: "ai" | "fallback") {
  return items
    .filter((item) => item.item_name?.trim())
    .slice(0, 30)
    .map((item) => ({
      item_name: item.item_name.trim().slice(0, 140),
      description: (item.description || item.item_name).trim(),
      quantity: Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      uom: (item.uom || "Nos").trim().slice(0, 40),
      category: (item.category || "غير مصنف").trim().slice(0, 120),
      specifications: (item.specifications || "").trim(),
      confidence: Math.max(0, Math.min(100, Number(item.confidence) <= 1 ? Number(item.confidence) * 100 : Number(item.confidence) || 0)),
      source,
    }));
}

/** Use paid LLM only when structured extraction is likely worth the cost */
export function shouldUseAiMaterialExtraction(input: ExtractionInput): boolean {
  if (process.env.DEEPSEEK_MATERIAL_EXTRACTION_ENABLED === "false") return false;

  const boq = (input.boq_file_text || "").trim();
  const materials = (input.materials || "").trim();
  const lineCount = materials.split(/\n/).filter((l) => l.trim().length >= 2).length;

  // Uploaded file text exists → prefer AI for messy PDF/BOQ tables
  if (boq.length >= 80) return true;
  if (input.boq_file_url && boq.length >= 20) return true;
  // BOQ / Excel / PDF text → AI helps
  if (boq.length >= 400) return true;
  // Multi-line typed list → AI helps
  if (lineCount >= 3) return true;
  // Long single blob (paste from spreadsheet) → AI helps
  if (materials.length >= 500) return true;
  if (boq.length + materials.length >= 900) return true;

  // Short requests like "اسمنت وحديد" → free keyword fallback is enough
  return false;
}

function tableExtract(input: ExtractionInput): ExtractedMaterialItem[] {
  const sourceText = [input.boq_file_text, input.materials].filter(Boolean).join("\n");
  const parsed = parseBoqTableText(sourceText);
  return parsed.map((item) => ({ ...item, source: item.source as "fallback" }));
}

export async function extractMaterialItems(input: ExtractionInput): Promise<ExtractedMaterialItem[]> {
  const tableItems = tableExtract(input);
  if (tableItems.length >= 2) {
    return tableItems;
  }

  if (!shouldUseAiMaterialExtraction(input)) {
    return tableItems.length ? tableItems : fallbackExtract(input);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return fallbackExtract(input);
  }

  // تحقق من الـ cache أولاً
  const cacheKey = hashInput(input);
  const cached = extractionCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MATERIAL_EXTRACTION_MODEL || "deepseek-v4-pro",
        messages: [
          {
            role: "system",
            content:
              "You extract construction procurement line items from Arabic or English customer requests, BOQ files, quantity schedules, CSV text, and Excel sheet text. Return JSON only. Extract product/material rows with quantity, unit, category, and specs. Do not invent brands, quantities, or specs. Use Arabic category names when possible, such as مواد بناء وإنشاء، كهرباء وإنارة، سباكة، أدوات صحية، تكييف وتبريد، أنظمة الأنابيب. Confidence must be 0 to 100. If a row is unclear, keep it with low confidence.",
          },
          {
            role: "user",
            content: [
              `Customer typed materials:\n${input.materials}`,
              input.boq_file_text ? `Extracted file text:\n${input.boq_file_text}` : "",
              input.notes ? `Notes:\n${input.notes}` : "",
              input.boq_file_url ? `Uploaded file URL:\n${input.boq_file_url}` : "",
              `Required JSON shape:
{
  "items": [
    {
      "item_name": "short product/material name",
      "description": "source row or clear description",
      "quantity": 1,
      "uom": "Nos",
      "category": "one category or غير مصنف",
      "specifications": "size, grade, brand, standard, or other specs",
      "confidence": 0
    }
  ]
}`,
            ].filter(Boolean).join("\n\n").slice(0, 140_000),
          },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const json = await response.json();
    const outputText = (json as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content
      || extractOutputText(json);
    const parsed = JSON.parse(outputText) as { items?: Array<Omit<ExtractedMaterialItem, "source">> };
    const items = normalizeItems(parsed.items || [], "ai");
    const result = items.length ? items : (tableItems.length ? tableItems : fallbackExtract(input));

    // خزّن النتيجة في الـ cache
    extractionCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });

    return result;
  } catch (error) {
    console.error("Material extraction failed, using fallback:", error);
    return tableItems.length ? tableItems : fallbackExtract(input);
  }
}
