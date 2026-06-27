export type ParsedBoqItem = {
  item_name: string;
  description: string;
  quantity: number;
  uom: string;
  category: string;
  specifications: string;
  confidence: number;
  source: "fallback";
};

const HEADER_HINTS = [
  "وصف",
  "الصنف",
  "المادة",
  "البند",
  "الكمية",
  "الوحدة",
  "المواصفات",
  "م",
  "ت",
  "description",
  "item",
  "material",
  "qty",
  "quantity",
  "uom",
  "unit",
  "spec",
  "sheet:",
];

const UOM_ALIASES: Record<string, string> = {
  "م2": "م²",
  m2: "م²",
  "م²": "م²",
  "متر": "م",
  m: "م",
  mm: "ملم",
  ملم: "ملم",
  طن: "طن",
  ton: "طن",
  كجم: "كجم",
  kg: "كجم",
  كيس: "كيس",
  bag: "كيس",
  حبة: "حبة",
  pcs: "حبة",
  piece: "حبة",
  لفة: "لفة",
  roll: "لفة",
  nos: "حبة",
  عدد: "حبة",
  لتر: "لتر",
  liter: "لتر",
};

const categoryKeywords = [
  { category: "مواد بناء وإنشاء", keywords: ["اسمنت", "أسمنت", "cement", "خرسانة", "بلوك", "حديد", "rebar", "رمل", "حصى"] },
  { category: "أدوات السلامة", keywords: ["سلامة", "helmet", "قفاز", "حذاء", "safety"] },
  { category: "دهانات وديكور", keywords: ["دهان", "طلاء", "paint", "جبس", "ديكور"] },
  { category: "كهرباء وإنارة", keywords: ["كهرب", "إنارة", "انارة", "كيبل", "كابل", "لمبة", "led", "cable", "قاطع"] },
  { category: "سباكة", keywords: ["سباكة", "محبس", "صمام", "valve", "خلاط"] },
  { category: "أدوات صحية", keywords: ["كرسي", "مغسلة", "sanitary", "مرحاض"] },
  { category: "تكييف وتبريد", keywords: ["مكيف", "تكييف", "duct", "hvac", "تبريد"] },
  { category: "أنظمة الأنابيب", keywords: ["ماسورة", "أنبوب", "انبوب", "pipe", "pvc", "cpvc", "hdpe"] },
  { category: "مضخات وخزانات", keywords: ["مضخة", "خزان", "pump", "tank"] },
  { category: "أرضيات وسيراميك", keywords: ["سيراميك", "بلاط", "tile", "رخام", "أرضيات"] },
  { category: "عوازل", keywords: ["عازل", "عزل", "insulation", "waterproof"] },
  { category: "مواد لاصقة", keywords: ["لاصق", "غراء", "adhesive", "سيليكون"] },
];

function normalizeNumber(value: string): number {
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeUom(raw?: string): string {
  if (!raw) return "حبة";
  const key = raw.trim().toLowerCase();
  return UOM_ALIASES[key] || raw.trim();
}

function inferCategory(text: string): string {
  const lowered = text.toLowerCase();
  return (
    categoryKeywords.find(({ keywords }) => keywords.some((keyword) => lowered.includes(keyword.toLowerCase())))
      ?.category || "غير مصنف"
  );
}

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (!lower || lower.length < 2) return true;
  if (/^(sheet|page)\s*:/i.test(lower)) return true;
  const hits = HEADER_HINTS.filter((hint) => lower.includes(hint.toLowerCase())).length;
  return hits >= 2 || (hits >= 1 && lower.length < 30);
}

function cleanupName(text: string): string {
  return text.replace(/^[\s\-*•\d.()]+/, "").replace(/\s+/g, " ").trim();
}

function buildItem(
  name: string,
  quantity: number,
  uom: string,
  description?: string,
  confidence = 72
): ParsedBoqItem {
  const itemName = cleanupName(name).slice(0, 140);
  return {
    item_name: itemName || "بند مواد",
    description: (description || itemName).slice(0, 500),
    quantity,
    uom: normalizeUom(uom),
    category: inferCategory(itemName),
    specifications: "",
    confidence,
    source: "fallback",
  };
}

function parseQuantityUomTail(text: string): { name: string; quantity: number; uom: string } | null {
  const match = text.match(/^(.+?)\s+([٠-٩۰-۹\d]+(?:[.,][٠-٩۰-۹\d]+)?)\s*([^\d\s]{1,12})?\s*$/u);
  if (!match) return null;
  const name = cleanupName(match[1]);
  if (!name || name.length < 2) return null;
  return {
    name,
    quantity: normalizeNumber(match[2]),
    uom: normalizeUom(match[3] || "حبة"),
  };
}

function parseCsvRow(line: string): ParsedBoqItem | null {
  const parts = line.split(/,|\t|؛|;/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  let qtyIndex = -1;
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (/^[٠-٩۰-۹\d]+([.,][٠-٩۰-۹\d]+)?$/.test(parts[i].replace(/,/g, ""))) {
      qtyIndex = i;
      break;
    }
  }
  if (qtyIndex <= 0) return null;

  const quantity = normalizeNumber(parts[qtyIndex]);
  const uom = parts[qtyIndex + 1] && !/^[٠-٩۰-۹\d]+/.test(parts[qtyIndex + 1]) ? parts[qtyIndex + 1] : "حبة";
  const nameParts = parts.slice(0, qtyIndex).filter((p) => !/^\d+$/.test(p));
  const name = cleanupName(nameParts.join(" "));
  if (!name || isHeaderLine(name)) return null;

  return buildItem(name, quantity, uom, name, 78);
}

function dedupeItems(items: ParsedBoqItem[]): ParsedBoqItem[] {
  const seen = new Map<string, ParsedBoqItem>();
  for (const item of items) {
    const key = item.item_name.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, item);
      continue;
    }
    existing.quantity += item.quantity;
    existing.confidence = Math.max(existing.confidence, item.confidence);
  }
  return [...seen.values()].slice(0, 50);
}

const PRODUCT_KEYWORDS =
  /PVC|CPVC|ADAPTOR|ADAPTER|BEND|BUSH|COUPLING|SOCKET|REDUCER|TEE|ELBOW|PIPE|VALVE|FITTING|CL\d|SCH|MM\b|MXS|FXS|THRD|RUBBER|BRASS|حديد|اسمنت|أسمنت|بلوك|سيراميك|كابل|مكيف|سباكة|دهان|عازل|مضخة|خزان/i;

function isValidItemName(name: string): boolean {
  const arabic = (name.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (name.match(/[A-Za-z]/g) || []).length;
  const total = name.length;
  if (total < 4) return false;
  if (arabic >= 4) return true;
  if (latin >= 8 && latin / total >= 0.35) return true;
  const symbols = (name.match(/[^A-Za-z0-9\u0600-\u06FF\s"'./-]/g) || []).length;
  return symbols / total < 0.25 && latin >= 6;
}

function findNearbyQuantity(lines: string[], index: number): number {
  for (let j = Math.max(0, index - 1); j <= Math.min(lines.length - 1, index + 3); j++) {
    const match = lines[j].match(/(?:^|\s)(\d{1,6}(?:\.\d{1,2})?)(?:\s*(?:\||t\b|nos\b|nr\b)|\s*$)/i);
    if (match) return normalizeNumber(match[1]);
  }
  return 1;
}

function parseEnglishBoqLines(text: string): ParsedBoqItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);

  const items: ParsedBoqItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isHeaderLine(line)) continue;
    if (!PRODUCT_KEYWORDS.test(line)) continue;
    if (line.length < 12 || line.length > 220) continue;
    if (!isValidItemName(line)) continue;
    if (/^(sr|st)\.?\s*no/i.test(line)) continue;

    const quantity = findNearbyQuantity(lines, i);
    items.push(buildItem(line, quantity, "حبة", line, 82));
  }

  return dedupeItems(items);
}

function parseBoqTableLines(text: string): ParsedBoqItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);

  const items: ParsedBoqItem[] = [];

  for (const line of lines) {
    if (isHeaderLine(line)) continue;

    const csvItem = parseCsvRow(line);
    if (csvItem && isValidItemName(csvItem.item_name)) {
      items.push(csvItem);
      continue;
    }

    const tail = parseQuantityUomTail(line);
    if (tail && isValidItemName(tail.name)) {
      items.push(buildItem(tail.name, tail.quantity, tail.uom, line, 70));
      continue;
    }

    const inline = line.match(/(.{3,}?)\s*[:\-–]\s*([٠-٩۰-۹\d]+(?:[.,][٠-٩۰-۹\d]+)?)\s*([^\d]{0,12})?$/u);
    if (inline) {
      const name = cleanupName(inline[1]);
      if (name && !isHeaderLine(name) && isValidItemName(name)) {
        items.push(buildItem(name, normalizeNumber(inline[2]), inline[3] || "حبة", line, 65));
      }
    }
  }

  return dedupeItems(items);
}

export function parseBoqTableText(text: string): ParsedBoqItem[] {
  const source = text.replace(/\u0000/g, "").trim();
  if (!source) return [];

  const englishItems = parseEnglishBoqLines(source);
  const tableItems = parseBoqTableLines(source);

  const merged = dedupeItems([...englishItems, ...tableItems]).filter((item) => isValidItemName(item.item_name));
  if (merged.length >= 2) return merged.slice(0, 50);

  const fallbackItems = parseBoqTableLines(source).filter((item) => isValidItemName(item.item_name));
  return fallbackItems.slice(0, 50);
}

export function hasStructuredBoqContent(text: string): boolean {
  return parseBoqTableText(text).length >= 2;
}