export type VendorOption = {
  value: string;
  en: string;
  ar: string;
};

export const vendorTypes: VendorOption[] = [
  { value: "direct_manufacturer", en: "Direct Manufacturer", ar: "مصنع مباشر" },
  { value: "authorized_distributor", en: "Authorized Distributor", ar: "موزع معتمد" },
  { value: "exclusive_agent", en: "Exclusive Agent", ar: "وكيل حصري" },
  { value: "project_supplier", en: "Project Supplier", ar: "مورد مشاريع" },
  { value: "importer", en: "Importer", ar: "مستورد" },
];

export const productCategories: VendorOption[] = [
  { value: "sanitaryware_bath_fittings", en: "Sanitaryware & Bath Fittings", ar: "الأدوات الصحية" },
  { value: "electrical_lighting", en: "Electrical & Lighting", ar: "الكهرباء والإنارة" },
  { value: "plumbing_piping_systems", en: "Plumbing & Piping Systems", ar: "السباكة وأنظمة الأنابيب" },
  { value: "hvac", en: "HVAC", ar: "التكييف والتهوية" },
  { value: "tiles_flooring", en: "Tiles & Flooring", ar: "الأرضيات" },
  { value: "wall_finishes_coverings", en: "Wall Finishes & Coverings", ar: "الجداريات" },
  { value: "paints_coatings", en: "Paints & Coatings", ar: "الدهانات الداخلية والخارجية" },
  { value: "adhesives_grouts_sealants", en: "Adhesives, Grouts & Sealants", ar: "اللواصق والمواد المساعدة" },
];

export const regions: VendorOption[] = [
  { value: "riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "makkah", en: "Makkah", ar: "مكة" },
  { value: "madinah", en: "Madinah", ar: "المدينة" },
  { value: "eastern", en: "Eastern Province", ar: "الشرقية" },
  { value: "qassim", en: "Qassim", ar: "القصيم" },
  { value: "asir", en: "Asir", ar: "عسير" },
  { value: "tabuk", en: "Tabuk", ar: "تبوك" },
  { value: "hail", en: "Hail", ar: "حائل" },
  { value: "northern_borders", en: "Northern Borders", ar: "الحدود الشمالية" },
  { value: "jazan", en: "Jazan", ar: "جازان" },
  { value: "najran", en: "Najran", ar: "نجران" },
  { value: "al_baha", en: "Al Baha", ar: "الباحة" },
  { value: "al_jouf", en: "Al Jouf", ar: "الجوف" },
  { value: "all_ksa", en: "All Saudi Arabia", ar: "كل المملكة" },
];

/** مدن التسليم لطلبات عرض السعر */
export const saudiCities: VendorOption[] = [
  { value: "riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "jeddah", en: "Jeddah", ar: "جدة" },
  { value: "dammam", en: "Dammam", ar: "الدمام" },
  { value: "khobar", en: "Khobar", ar: "الخبر" },
  { value: "dhahran", en: "Dhahran", ar: "الظهران" },
  { value: "jubail", en: "Jubail", ar: "الجبيل" },
  { value: "makkah", en: "Makkah", ar: "مكة المكرمة" },
  { value: "madinah", en: "Madinah", ar: "المدينة المنورة" },
  { value: "taif", en: "Taif", ar: "الطائف" },
  { value: "yanbu", en: "Yanbu", ar: "ينبع" },
  { value: "buraidah", en: "Buraidah", ar: "بريدة" },
  { value: "unaizah", en: "Unaizah", ar: "عنيزة" },
  { value: "khamis_mushait", en: "Khamis Mushait", ar: "خميس مشيط" },
  { value: "abha", en: "Abha", ar: "أبها" },
  { value: "tabuk", en: "Tabuk", ar: "تبوك" },
  { value: "hail", en: "Hail", ar: "حائل" },
  { value: "jazan", en: "Jazan", ar: "جازان" },
  { value: "najran", en: "Najran", ar: "نجران" },
  { value: "al_baha", en: "Al Baha", ar: "الباحة" },
  { value: "skaka", en: "Sakaka", ar: "سكاكا" },
  { value: "arar", en: "Arar", ar: "عرعر" },
  { value: "neom", en: "NEOM", ar: "نيوم" },
  { value: "other", en: "Other city", ar: "مدينة أخرى" },
];

export const paymentTerms: VendorOption[] = [
  { value: "bank_transfer", en: "Bank Transfer", ar: "تحويل بنكي" },
  { value: "cheque", en: "Cheque", ar: "شيك" },
  { value: "30_days", en: "30 Days", ar: "30 يوم" },
  { value: "60_days", en: "60 Days", ar: "60 يوم" },
];

export const yesNoOptions: VendorOption[] = [
  { value: "yes", en: "Yes", ar: "نعم" },
  { value: "no", en: "No", ar: "لا" },
];

export const saudiBanks: VendorOption[] = [
  { value: "al_rajhi", en: "Al Rajhi Bank", ar: "مصرف الراجحي" },
  { value: "al_ahli", en: "Saudi National Bank (SNB)", ar: "البنك الأهلي السعودي" },
  { value: "riyad", en: "Riyad Bank", ar: "بنك الرياض" },
  { value: "sabb", en: "SABB", ar: "ساب" },
  { value: "alinma", en: "Alinma Bank", ar: "مصرف الإنماء" },
  { value: "al_bilad", en: "Bank AlBilad", ar: "بنك البلاد" },
  { value: "al_jazira", en: "Bank AlJazira", ar: "بنك الجزيرة" },
  { value: "arab_national", en: "Arab National Bank", ar: "البنك العربي الوطني" },
  { value: "saudi_fransi", en: "Banque Saudi Fransi", ar: "البنك السعودي الفرنسي" },
  { value: "saib", en: "Saudi Investment Bank", ar: "البنك السعودي للاستثمار" },
  { value: "gib", en: "Gulf International Bank", ar: "بنك الخليج الدولي" },
  { value: "other", en: "Other", ar: "بنك آخر" },
];

export const saudiPhoneRegex = /^(05\d{8}|\+9665\d{8}|009665\d{8})$/;
export const crNumberRegex = /^\d{10,15}$/;
export const saudiIbanRegex = /^SA\d{22}$/i;
export const saudiVatRegex = /^3\d{13}3$/;
export const nationalAddressShortCodeRegex = /^[A-Za-z]{4}\d{4}$/;

// ── المورد الأجنبي ───────────────────────────────────────────────
export const supplierCountries: VendorOption[] = [
  { value: "sa", en: "Saudi Arabia", ar: "السعودية" },
  { value: "ae", en: "United Arab Emirates", ar: "الإمارات" },
  { value: "cn", en: "China", ar: "الصين" },
  { value: "tr", en: "Türkiye", ar: "تركيا" },
  { value: "in", en: "India", ar: "الهند" },
  { value: "eg", en: "Egypt", ar: "مصر" },
  { value: "de", en: "Germany", ar: "ألمانيا" },
  { value: "it", en: "Italy", ar: "إيطاليا" },
  { value: "other", en: "Other country", ar: "دولة أخرى" },
];

/** السعودية هي الافتراضي عند غياب القيمة (توافق رجعي مع الموردين الحاليين) */
export function isSaudiSupplierCountry(country: string | undefined | null): boolean {
  return !country || country === "sa";
}

// القيم مطابقة تماماً لحقول Selection في Odoo (x_studio_business_type / x_studio_brand_relationship_type / x_studio_price_update_method)
export const businessTypes: VendorOption[] = [
  { value: "manufacturer", en: "Manufacturer", ar: "مصنع" },
  { value: "authorized_distributor", en: "Authorized Distributor", ar: "موزع معتمد" },
  { value: "distributor", en: "Distributor", ar: "موزع" },
  { value: "importer", en: "Importer", ar: "مستورد" },
  { value: "exporter", en: "Exporter", ar: "مُصدِّر" },
  { value: "trader", en: "Trader", ar: "تاجر" },
  { value: "service_provider", en: "Service Provider", ar: "مقدم خدمة" },
];

export const brandRelationshipTypes: VendorOption[] = [
  { value: "manufacturer", en: "Manufacturer", ar: "مصنع" },
  { value: "authorized_distributor", en: "Authorized Distributor", ar: "موزع معتمد" },
  { value: "distributor", en: "Distributor", ar: "موزع" },
  { value: "trader", en: "Trader", ar: "تاجر" },
];

export const priceUpdateMethods: VendorOption[] = [
  { value: "manual", en: "Manual", ar: "يدوي" },
  { value: "excel", en: "Excel", ar: "Excel" },
  { value: "csv", en: "CSV", ar: "CSV" },
  { value: "api", en: "API", ar: "API" },
  { value: "email", en: "Email", ar: "Email" },
];

export const documentTypeLabels: Record<string, VendorOption> = {
  cr_certificate: { value: "cr_certificate", en: "Commercial Registration", ar: "السجل التجاري" },
  vat_certificate: { value: "vat_certificate", en: "VAT Certificate", ar: "شهادة ضريبة القيمة المضافة" },
  bank_letter: { value: "bank_letter", en: "Bank Letter", ar: "الخطاب البنكي" },
  national_address: { value: "national_address", en: "National Address", ar: "العنوان الوطني" },
  registration_certificate: { value: "registration_certificate", en: "Registration Certificate", ar: "شهادة التسجيل" },
};

export const shippingArrangements: VendorOption[] = [
  { value: "build_freight", en: "Build's freight agent collects from supplier", ar: "وكيل شحن بيلد يستلم من المورد" },
  { value: "supplier_ships", en: "Supplier ships to KSA", ar: "المورد يشحن إلى السعودية" },
  { value: "supplier_agent", en: "Supplier's own freight agent", ar: "وكيل شحن خاص بالمورد" },
];

// رقم تسجيل شركة دولي (أحرف/أرقام/شرطات) — أوسع من السجل السعودي
export const intlRegistrationRegex = /^[A-Za-z0-9\-/]{3,30}$/;
// SWIFT/BIC: 8 أو 11 خانة
export const swiftBicRegex = /^[A-Za-z]{4}[A-Za-z]{2}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
// IBAN/رقم حساب دولي عام
export const intlAccountRegex = /^[A-Za-z0-9 ]{8,40}$/;
// آيبان مرن: يقبل السعودي والدولي وأرقام الحسابات (يُتحقّق بعد إزالة المسافات)
export const flexibleIbanRegex = /^[A-Za-z0-9]{8,40}$/;
export function isFlexibleIban(value: string): boolean {
  return flexibleIbanRegex.test((value || "").replace(/\s/g, ""));
}

export function normalizeSaudiVatInput(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeNationalAddressInput(value: string): string {
  return value.trim();
}

export const vendorDialCodes = [
  { code: "+966", labelAr: "السعودية", labelEn: "Saudi Arabia" },
  { code: "+971", labelAr: "الإمارات", labelEn: "UAE" },
  { code: "+965", labelAr: "الكويت", labelEn: "Kuwait" },
  { code: "+973", labelAr: "البحرين", labelEn: "Bahrain" },
  { code: "+968", labelAr: "عُمان", labelEn: "Oman" },
  { code: "+974", labelAr: "قطر", labelEn: "Qatar" },
  { code: "+962", labelAr: "الأردن", labelEn: "Jordan" },
  { code: "+20", labelAr: "مصر", labelEn: "Egypt" },
  { code: "+91", labelAr: "الهند", labelEn: "India" },
  { code: "+86", labelAr: "الصين", labelEn: "China" },
] as const;

/** Normalize phone to E.164 (+country + number) */
export function normalizeVendorPhone(value: string): string {
  let v = value.trim().replace(/[\s().-]/g, "");
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (/^05\d{8}$/.test(v)) v = `+966${v.slice(1)}`;
  if (!v.startsWith("+") && /^[1-9]\d{7,14}$/.test(v)) v = `+${v}`;
  return v;
}

export function composeVendorPhone(dialCode: string, localNumber: string): string {
  const local = localNumber.replace(/\D/g, "");
  if (!local) return "";
  return normalizeVendorPhone(`${dialCode}${local}`);
}

export function parseVendorPhone(value: string): { dialCode: string; localNumber: string } {
  const normalized = normalizeVendorPhone(value);
  if (!normalized.startsWith("+")) return { dialCode: "+966", localNumber: value.replace(/\D/g, "") };

  const match = vendorDialCodes
    .map((c) => c.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => normalized.startsWith(code));

  if (match) {
    return { dialCode: match, localNumber: normalized.slice(match.length) };
  }

  return { dialCode: "+966", localNumber: normalized.replace(/\D/g, "") };
}

/** Valid E.164 mobile number */
export function isValidVendorPhone(value: string): boolean {
  const v = normalizeVendorPhone(value);
  return /^\+[1-9]\d{7,14}$/.test(v);
}

export const vendorErrorMessages: Record<string, { en: string; ar: string }> = {
  required: { en: "This field is required", ar: "هذا الحقل مطلوب" },
  invalidPhone: { en: "Enter a valid mobile number", ar: "أدخل رقم جوال صحيح" },
  invalidEmail: { en: "Invalid email address", ar: "البريد الإلكتروني غير صحيح" },
  invalidCR: { en: "CR number must be 10-15 digits", ar: "رقم السجل يجب أن يكون 10-15 رقم" },
  invalidIban: { en: "Invalid Saudi IBAN (SA + 22 digits)", ar: "رقم الآيبان غير صحيح (SA + 22 رقم)" },
};

export function textByLang(isRtl: boolean, en: string, ar: string) {
  return isRtl ? ar : en;
}

export function optionLabel(isRtl: boolean, options: VendorOption[], value: string) {
  const item = options.find((option) => option.value === value);
  if (!item) return value;
  return isRtl ? item.ar : item.en;
}

export function localizeVendorError(code: string | undefined, isRtl: boolean): string | undefined {
  if (!code) return undefined;
  const msg = vendorErrorMessages[code];
  return msg ? (isRtl ? msg.ar : msg.en) : code;
}

export function optionValuesToLabels(isRtl: boolean, options: VendorOption[], values: string[]) {
  return values.map((value) => optionLabel(isRtl, options, value)).join(isRtl ? "، " : ", ");
}