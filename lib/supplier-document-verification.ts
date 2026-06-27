import { downloadERPNextFile, getERPNextDocument } from "@/lib/erpnext";
import { extractTextFromBuffer } from "@/lib/file-text";
import { normalizeArabicName } from "@/lib/supplier-identity-verification";

/**
 * تدقيق آلي استشاري لمحتوى مستندات المورد (السجل التجاري + خطاب البنك).
 * يقرأ الملف المرفوع فعليًا من ERPNext على الخادم ويطابق ما أدخله المورد بمحتوى المستند.
 * استشاري فقط: لا يرفض الطلب — يضيف ملاحظات للمراجع، ويرفع علم "يحتاج مراجعة" عند تعارض مقروء.
 * الملفات الممسوحة (صور بلا نص) لا تُعدّ تعارضًا — تُحال للتدقيق اليدوي.
 */

const ARABIC_INDIC_OFFSET = 0x0660;
const PERSIAN_OFFSET = 0x06f0;

export function toAsciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_INDIC_OFFSET))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - PERSIAN_OFFSET));
}

export function digitsOnly(value: string): string {
  return toAsciiDigits(value).replace(/\D/g, "");
}

export function alphanumericUpper(value: string): string {
  return toAsciiDigits(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** هل تظهر أغلب كلمات الاسم (≥60%) داخل نص المستند؟ */
export function nameAppearsInText(name: string, text: string): boolean {
  const normalizedText = normalizeArabicName(text);
  const tokens = normalizeArabicName(name)
    .split(" ")
    .filter((token) => token.length > 2);
  if (!tokens.length) return false;
  const hits = tokens.filter((token) => normalizedText.includes(token)).length;
  return hits / tokens.length >= 0.6;
}

/** يرجّع نص المستند، أو "" إذا كان ملفًا بلا طبقة نص (ممسوح)، أو null إذا تعذّر الوصول. */
async function readErpFileText(fileName: string | undefined): Promise<string | null> {
  if (!fileName) return null;
  const file = await getERPNextDocument<{ name: string; file_url?: string }>("File", fileName);
  if (!file?.file_url) return null;
  const { buffer, fileName: resolvedName, mimeType } = await downloadERPNextFile(file.file_url);
  return await extractTextFromBuffer(resolvedName, mimeType, buffer);
}

type SectionResult = { lines: string[]; mismatch: boolean };

async function checkCrDocument(input: {
  crFileName?: string;
  crNumber: string;
  taxNumber: string;
  crNameTyped: string;
}): Promise<SectionResult> {
  try {
    const text = await readErpFileText(input.crFileName);
    if (text === null) return { lines: ["⚠️ السجل التجاري: تعذّر الوصول للملف — دقّقه يدويًا."], mismatch: false };
    if (text.trim() === "")
      return { lines: ["⚠️ السجل التجاري: الملف على الأرجح صورة ممسوحة (بلا نص) — دقّقه يدويًا."], mismatch: false };

    const lines: string[] = [];
    let mismatch = false;
    const docDigits = digitsOnly(text);

    const crNum = digitsOnly(input.crNumber);
    if (crNum && docDigits.includes(crNum)) {
      lines.push(`✅ رقم السجل (${crNum}) موجود في ملف السجل.`);
    } else if (crNum) {
      lines.push(`❌ رقم السجل (${crNum}) غير موجود في ملف السجل — تحقق من احتمال خطأ أو تزوير.`);
      mismatch = true;
    }

    if (nameAppearsInText(input.crNameTyped, text)) {
      lines.push("✅ اسم المنشأة المُدخَل يظهر في ملف السجل.");
    } else {
      lines.push("❌ اسم المنشأة المُدخَل لا يظهر في ملف السجل — راجع يدويًا.");
      mismatch = true;
    }

    const vat = digitsOnly(input.taxNumber);
    if (vat && docDigits.includes(vat)) lines.push("✅ الرقم الضريبي يظهر ضمن مستند السجل.");

    return { lines, mismatch };
  } catch {
    return { lines: ["⚠️ تعذّر قراءة ملف السجل آليًا — دقّقه يدويًا."], mismatch: false };
  }
}

async function checkBankDocument(input: {
  bankFileName?: string;
  ibanTyped: string;
  ibanAccountNameTyped: string;
}): Promise<SectionResult> {
  try {
    const text = await readErpFileText(input.bankFileName);
    if (text === null) return { lines: ["⚠️ خطاب البنك: تعذّر الوصول للملف — دقّقه يدويًا."], mismatch: false };
    if (text.trim() === "")
      return { lines: ["⚠️ خطاب البنك: الملف على الأرجح صورة ممسوحة (بلا نص) — دقّقه يدويًا."], mismatch: false };

    const lines: string[] = [];
    let mismatch = false;
    const docCompact = alphanumericUpper(text);

    const iban = alphanumericUpper(input.ibanTyped);
    if (iban && docCompact.includes(iban)) {
      lines.push("✅ الآيبان المُدخَل موجود في خطاب البنك.");
    } else if (iban) {
      lines.push("❌ الآيبان المُدخَل غير موجود في خطاب البنك — تحقق قبل أي تحويل مالي.");
      mismatch = true;
    }

    if (nameAppearsInText(input.ibanAccountNameTyped, text)) {
      lines.push("✅ اسم صاحب الحساب المُدخَل يظهر في خطاب البنك.");
    } else {
      lines.push("❌ اسم صاحب الحساب المُدخَل لا يظهر في خطاب البنك — راجع يدويًا.");
      mismatch = true;
    }

    return { lines, mismatch };
  } catch {
    return { lines: ["⚠️ تعذّر قراءة خطاب البنك آليًا — دقّقه يدويًا."], mismatch: false };
  }
}

export type SupplierExtractedFields = {
  taxNumber: string;
  nationalAddress: string;
  lines: string[];
  complete: boolean;
};

/**
 * استخلاص آلي للرقم الضريبي (من شهادة الضريبة) والعنوان الوطني (من مستنده) — يُراجَع بشريًا.
 * fail-safe: عند تعذّر القراءة/الاستخلاص يرجّع قيمة فارغة (لا يكسر الإرسال).
 */
export async function extractSupplierFieldsFromDocs(input: {
  vatFileName?: string;
  addressFileName?: string;
}): Promise<SupplierExtractedFields> {
  const lines: string[] = ["── استخلاص آلي من المستندات (للمراجعة البشرية) ──"];
  let taxNumber = "";
  let nationalAddress = "";

  try {
    const vatText = await readErpFileText(input.vatFileName);
    if (vatText && vatText.trim()) {
      const m = toAsciiDigits(vatText).match(/3\d{13}3/);
      if (m) { taxNumber = m[0]; lines.push(`✅ الرقم الضريبي المُستخلص: ${taxNumber}`); }
      else lines.push("⚠️ لم يُستخلص رقم ضريبي صالح من شهادة الضريبة — يُراجع يدويًا.");
    } else {
      lines.push("⚠️ شهادة الضريبة غير قابلة للقراءة آليًا (صورة ممسوحة؟) — يُراجع يدويًا.");
    }
  } catch {
    lines.push("⚠️ تعذّر قراءة شهادة الضريبة — يُراجع يدويًا.");
  }

  try {
    const addrText = await readErpFileText(input.addressFileName);
    if (addrText && addrText.trim()) {
      const m = alphanumericUpper(addrText).match(/[A-Z]{4}\d{4}/);
      if (m) { nationalAddress = m[0]; lines.push(`✅ العنوان الوطني المُستخلص: ${nationalAddress}`); }
      else lines.push("⚠️ لم يُستخلص رمز عنوان وطني — يُراجع يدويًا.");
    } else {
      lines.push("⚠️ مستند العنوان الوطني غير قابل للقراءة آليًا — يُراجع يدويًا.");
    }
  } catch {
    lines.push("⚠️ تعذّر قراءة مستند العنوان الوطني — يُراجع يدويًا.");
  }

  return { taxNumber, nationalAddress, lines, complete: Boolean(taxNumber && nationalAddress) };
}

export type SupplierDocCheckResult = {
  lines: string[];
  hasReadableMismatch: boolean;
};

export async function verifySupplierDocuments(input: {
  crFileName?: string;
  bankFileName?: string;
  crNumber: string;
  taxNumber: string;
  crNameTyped: string;
  ibanTyped: string;
  ibanAccountNameTyped: string;
}): Promise<SupplierDocCheckResult> {
  const [cr, bank] = await Promise.all([
    checkCrDocument({
      crFileName: input.crFileName,
      crNumber: input.crNumber,
      taxNumber: input.taxNumber,
      crNameTyped: input.crNameTyped,
    }),
    checkBankDocument({
      bankFileName: input.bankFileName,
      ibanTyped: input.ibanTyped,
      ibanAccountNameTyped: input.ibanAccountNameTyped,
    }),
  ]);

  return {
    lines: ["── تدقيق آلي لمحتوى المستندات (استشاري — قراءة نص المستند المرفوع) ──", ...cr.lines, ...bank.lines],
    hasReadableMismatch: cr.mismatch || bank.mismatch,
  };
}
