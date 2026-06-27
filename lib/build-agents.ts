import { getERPNextList } from "@/lib/erpnext";
import {
  runSupplierIdentityVerification,
  type IdentityVerificationInput,
} from "@/lib/supplier-identity-verification";

// Maps website supplier categories → ERPNext Item Groups
const CATEGORY_TO_ITEM_GROUP: Record<string, string> = {
  // مفردات فئات الاستخراج (lib/material-extraction.ts) — مطابقة دقيقة
  "مواد بناء وإنشاء": "Building Materials",
  "أدوات السلامة": "Safety Tools",
  "دهانات وديكور": "Paint and Finishes",
  "كهرباء وإنارة": "Electrical and Lighting",
  "تكييف وتبريد": "HVAC",
  "أنظمة الأنابيب": "Piping Systems",
  "مضخات وخزانات": "Pumps and Tanks",
  "أرضيات وسيراميك": "Flooring and Ceramics",
  عوازل: "Insulation",
  "مواد لاصقة": "Adhesives",
  "مواد بناء": "Building Materials",
  "حديد": "Building Materials",
  "أسمنت": "Building Materials",
  "عزل": "Insulation",
  "عزل حراري": "Insulation",
  "سباكة": "Plumbing",
  "كهرباء": "Electrical and Lighting",
  "إضاءة": "Electrical and Lighting",
  "أرضيات": "Flooring and Ceramics",
  "سيراميك": "Flooring and Ceramics",
  "دهانات": "Paint and Finishes",
  "تشطيبات": "Paint and Finishes",
  "تكييف": "HVAC",
  "أنابيب": "Piping Systems",
  "مضخات": "Pumps and Tanks",
  "خزانات": "Pumps and Tanks",
  "أدوات سلامة": "Safety Tools",
  "أدوات صحية": "Sanitary Ware",
  "لاصقات": "Adhesives",
  building_materials: "Building Materials",
  insulation: "Insulation",
  plumbing: "Plumbing",
  electrical: "Electrical and Lighting",
  flooring: "Flooring and Ceramics",
  paint: "Paint and Finishes",
  hvac: "HVAC",
  piping: "Piping Systems",
  pumps: "Pumps and Tanks",
  safety: "Safety Tools",
  sanitary: "Sanitary Ware",
  adhesives: "Adhesives",
};

const REGION_KEYWORDS: Record<string, string[]> = {
  الرياض: ["الرياض", "riyadh", "الدرعية", "الخرج"],
  "مكة المكرمة": ["جدة", "مكة", "jeddah", "makkah", "الطائف", "rabigh"],
  "المنطقة الشرقية": ["الدمام", "الخبر", "الظهران", "الجبيل", "dammam", "khobar", "dhahran", "eastern"],
  المدينة: ["المدينة", "madinah", "yanbu", "ينبع"],
  القصيم: ["بريدة", "عنيزة", "buraidah", "qassim"],
  عسير: ["أبها", "خميس", "abha", "asir"],
  تبوك: ["تبوك", "tabuk", "نيوم", "neom"],
};

export type SupplierAgentResult = {
  score: number;
  priority: "Preferred" | "Standard" | "Do Not Use";
  verificationStatus: "Pending" | "Verified" | "Needs More Information" | "Failed";
  catalogGroups: string[];
  summary: string;
  checks: string[];
};

export type OpportunityAgentResult = {
  summary: string;
  materialNotes: string[];
  suggestedSuppliers: SupplierSuggestion[];
  deliveryRegion: string | null;
  autoApprovedItems: number;
  needsReviewItems: number;
};

export type SupplierSuggestion = {
  name: string;
  supplier_name: string;
  score: number;
  priority: string;
  categories: string;
  regions: string;
  reasons: string[];
};

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export function mapCategoriesToItemGroups(categories: string[]): string[] {
  const groups = new Set<string>();
  for (const cat of categories) {
    const key = normalize(cat);
    for (const [pattern, group] of Object.entries(CATEGORY_TO_ITEM_GROUP)) {
      if (key.includes(normalize(pattern)) || normalize(pattern).includes(key)) {
        groups.add(group);
      }
    }
  }
  if (!groups.size) groups.add("Building Materials");
  return [...groups];
}

export function detectRegionFromAddress(address: string): string | null {
  const lower = normalize(address);
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(normalize(kw)))) return region;
  }
  return null;
}

export function runSupplierAgent(vendor: {
  cr_number: string;
  product_categories: string[];
  coverage_regions: string[];
  has_warehouse: boolean;
  offers_credit: boolean;
  worked_on_gov_projects: boolean;
  payment_terms: string[];
  establishment_name: string;
  identity?: Omit<IdentityVerificationInput, "establishment_name" | "cr_number">;
}): SupplierAgentResult {
  const checks: string[] = [];
  let score = 0;

  if (/^\d{10,15}$/.test(vendor.cr_number)) {
    checks.push("✅ السجل التجاري بصيغة صحيحة");
    score += 15;
  } else {
    checks.push("❌ صيغة السجل التجاري غير صحيحة");
  }

  if (vendor.has_warehouse) {
    checks.push("✅ لديه مستودع في السعودية (+30)");
    score += 30;
  } else {
    checks.push("⚠️ لا يوجد مستودع محلي");
  }

  if (vendor.offers_credit) {
    checks.push("✅ يقدم شروط ائتمان (+25)");
    score += 25;
  }

  if (vendor.worked_on_gov_projects) {
    checks.push("✅ خبرة في مشاريع حكومية (+20)");
    score += 20;
  }

  if (vendor.product_categories.length >= 2) {
    checks.push(`✅ تنوع فئات: ${vendor.product_categories.length} فئات (+10)`);
    score += 10;
  }

  if (vendor.coverage_regions.length >= 2) {
    checks.push(`✅ تغطية جغرافية: ${vendor.coverage_regions.join("، ")} (+10)`);
    score += 10;
  } else if (vendor.coverage_regions.length === 1) {
    checks.push(`○ تغطية منطقة واحدة: ${vendor.coverage_regions[0]}`);
    score += 5;
  }

  const catalogGroups = mapCategoriesToItemGroups(vendor.product_categories);
  checks.push(`📦 الكتالوج المقترح: ${catalogGroups.join("، ")}`);

  let priority: SupplierAgentResult["priority"] = "Standard";
  if (score >= 55) priority = "Preferred";
  if (score < 15) priority = "Do Not Use";

  let verificationStatus: SupplierAgentResult["verificationStatus"] =
    score < 15 ? "Needs More Information" : "Pending";

  const identitySummary: string[] = [];
  if (vendor.identity) {
    const identity = runSupplierIdentityVerification({
      establishment_name: vendor.establishment_name,
      cr_number: vendor.cr_number,
      ...vendor.identity,
    });
    identitySummary.push(...identity.summaryLines);
    if (identity.verificationStatus === "Failed") {
      verificationStatus = "Failed";
    } else if (identity.verificationStatus === "Needs More Information") {
      verificationStatus = "Needs More Information";
    }
    if (!identity.allCriticalPassed) {
      score = Math.min(score, 40);
      if (priority !== "Do Not Use" && score < 55) priority = "Standard";
    }
  }

  const summary = [
    `📊 تقييم تلقائي للملف — ${vendor.establishment_name}`,
    `الدرجة: ${score}/100 | الأولوية المقترحة: ${priority}`,
    "(قواعد ثابتة — بدون استهلاك توكن)",
    "",
    ...checks,
    "",
    ...(identitySummary.length ? [...identitySummary, ""] : []),
    "⏳ الخطوة التالية: راجع الملف والمستندات ثم اعتمد نهائياً من Workflow",
  ].join("\n");

  return { score, priority, verificationStatus, catalogGroups, summary, checks };
}

function scoreSupplierMatch(
  supplier: {
    name: string;
    supplier_name: string;
    build_product_categories?: string;
    build_coverage_regions?: string;
    build_rfq_priority?: string;
    build_preferred_for_rfq?: number;
  },
  categories: string[],
  deliveryRegion: string | null
): SupplierSuggestion | null {
  if (supplier.build_rfq_priority === "Do Not Use") return null;

  const supRegions = normalize(supplier.build_coverage_regions || "");
  const reasons: string[] = [];
  let score = 0;

  // توحيد الطرفين على Item Groups القانونية: المورد يخزّن قيمًا إنجليزية، والطلب فئات عربية مستخرجة
  const supplierGroups = new Set(
    mapCategoriesToItemGroups(
      (supplier.build_product_categories || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    )
  );
  const requestedGroups = mapCategoriesToItemGroups(categories);
  let categoryHits = 0;
  for (const group of requestedGroups) {
    if (supplierGroups.has(group)) categoryHits++;
  }
  if (categoryHits > 0) {
    score += categoryHits * 20;
    reasons.push(`✅ يغطي ${categoryHits} فئة مطلوبة`);
  } else if (categories.length) {
    return null;
  } else {
    score += 10;
    reasons.push("○ لم تُحدد فئات — مورد عام");
  }

  if (supplier.build_rfq_priority === "Preferred" || supplier.build_preferred_for_rfq) {
    score += 25;
    reasons.push("⭐ مورد مفضل");
  }

  if (deliveryRegion) {
    const regionKeywords = REGION_KEYWORDS[deliveryRegion] || [deliveryRegion];
    const coversAllKsa = supRegions.includes("all_ksa") || supRegions.includes("كل المملكة");
    if (coversAllKsa || regionKeywords.some((kw) => supRegions.includes(normalize(kw)))) {
      score += 30;
      reasons.push(coversAllKsa ? "✅ يغطي كل المملكة" : `✅ يغطي منطقة التسليم: ${deliveryRegion}`);
    } else {
      score -= 10;
      reasons.push(`⚠️ خارج منطقة التسليم (${deliveryRegion})`);
    }
  }

  return {
    name: supplier.name,
    supplier_name: supplier.supplier_name || supplier.name,
    score,
    priority: supplier.build_rfq_priority || "Standard",
    categories: supplier.build_product_categories || "",
    regions: supplier.build_coverage_regions || "",
    reasons,
  };
}

export async function suggestSuppliersForOpportunity(params: {
  categories: string[];
  deliveryAddress: string;
  limit?: number;
}): Promise<SupplierSuggestion[]> {
  const suppliers = await getERPNextList<{
    name: string;
    supplier_name: string;
    build_product_categories?: string;
    build_coverage_regions?: string;
    build_rfq_priority?: string;
    build_preferred_for_rfq?: number;
  }>("Supplier", {
    fields: [
      "name",
      "supplier_name",
      "build_product_categories",
      "build_coverage_regions",
      "build_rfq_priority",
      "build_preferred_for_rfq",
    ],
    filters: [
      ["Supplier", "build_supplier_stage", "=", "Approved"],
      ["Supplier", "build_profile_completed", "=", 1],
    ],
    limit: 50,
  });

  const deliveryRegion = detectRegionFromAddress(params.deliveryAddress);
  const ranked: SupplierSuggestion[] = [];

  for (const supplier of suppliers) {
    const match = scoreSupplierMatch(supplier, params.categories, deliveryRegion);
    if (match && match.score > 0) ranked.push(match);
  }

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 5);
}

export function runOpportunityAgent(params: {
  project_name: string;
  client_name: string;
  delivery_address: string;
  materials?: string;
  extracted_items?: Array<{
    item_name: string;
    category: string;
    confidence: number;
    review_status?: string;
  }>;
  suggested_suppliers?: SupplierSuggestion[];
}): OpportunityAgentResult {
  const deliveryRegion = detectRegionFromAddress(params.delivery_address);
  const materialNotes: string[] = [];
  const categories = new Set<string>();
  let autoApprovedItems = 0;
  let needsReviewItems = 0;

  for (const item of params.extracted_items || []) {
    if (item.category) categories.add(item.category);
    if (item.confidence >= 85) {
      autoApprovedItems++;
      materialNotes.push(`✅ ${item.item_name} — ثقة ${item.confidence}%`);
    } else {
      needsReviewItems++;
      materialNotes.push(`⚠️ ${item.item_name} — يحتاج مراجعة (${item.confidence}%)`);
    }
  }

  if (!params.extracted_items?.length && params.materials) {
    materialNotes.push("📝 مواد نصية — لم يُستخرج جدول structured");
    categories.add("مواد بناء");
  }

  const supplierLines = (params.suggested_suppliers || []).map((s, i) => {
    const badge = s.priority === "Preferred" ? "⭐" : "○";
    return `${i + 1}. ${badge} ${s.supplier_name} (درجة ${s.score}) — ${s.reasons.join(" | ")}`;
  });

  const summary = [
    `📊 ملخص تلقائي للطلب — ${params.project_name}`,
    `العميل: ${params.client_name}`,
    deliveryRegion ? `منطقة التسليم: ${deliveryRegion}` : "منطقة التسليم: غير محددة",
    "",
    "── المواد ──",
    ...(materialNotes.length ? materialNotes : ["لا توجد مواد مستخرجة — راجع النص الأصلي"]),
    "",
    `جاهز تلقائياً: ${autoApprovedItems} | يحتاج مراجعة: ${needsReviewItems}`,
    "",
    "── موردون مقترحون (مطابقة فئات + منطقة) ──",
    ...(supplierLines.length ? supplierLines : ["لا يوجد مورد معتمد نهائياً مطابق — راجع قائمة الموردين"]),
    "",
    "⏳ الخطوة التالية: Start Review من Workflow",
  ].join("\n");

  return {
    summary,
    materialNotes,
    suggestedSuppliers: params.suggested_suppliers || [],
    deliveryRegion,
    autoApprovedItems,
    needsReviewItems,
  };
}