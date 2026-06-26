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
  { value: "building_materials", en: "Building Materials", ar: "مواد بناء وإنشاء" },
  { value: "safety_tools", en: "Safety Tools", ar: "أدوات السلامة" },
  { value: "paint_decor", en: "Paint & Decor", ar: "دهانات وديكور" },
  { value: "electrical_lighting", en: "Electrical & Lighting", ar: "كهرباء وإنارة" },
  { value: "plumbing", en: "Plumbing", ar: "سباكة" },
  { value: "sanitary_ware", en: "Sanitary Ware", ar: "أدوات صحية" },
  { value: "hvac", en: "HVAC", ar: "تكييف وتبريد" },
  { value: "piping_systems", en: "Piping Systems", ar: "أنظمة الأنابيب" },
  { value: "pumps_tanks", en: "Pumps & Tanks", ar: "مضخات وخزانات" },
  { value: "flooring_ceramics", en: "Flooring & Ceramics", ar: "أرضيات وسيراميك" },
  { value: "insulation", en: "Insulation", ar: "عوازل" },
  { value: "adhesives", en: "Adhesives", ar: "مواد لاصقة" },
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

export const vendorErrorMessages: Record<string, { en: string; ar: string }> = {
  required: { en: "This field is required", ar: "هذا الحقل مطلوب" },
  invalidPhone: { en: "Invalid Saudi phone (e.g. 05xxxxxxxx)", ar: "رقم الهاتف غير صحيح (مثال: 05xxxxxxxx)" },
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