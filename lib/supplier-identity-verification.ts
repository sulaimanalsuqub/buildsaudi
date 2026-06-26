export type IdentityVerificationInput = {
  establishment_name: string;
  cr_number: string;
  cr_name_on_document: string;
  iban_account_name: string;
  tax_number: string;
  national_address: string;
  iban: string;
};

export type IdentityCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type IdentityVerificationResult = {
  checks: IdentityCheck[];
  matchScore: number;
  allCriticalPassed: boolean;
  verificationStatus: "Verified" | "Needs More Information" | "Failed";
  summaryLines: string[];
};

const COMMON_NAME_STOPWORDS = new Set([
  "مؤسسة",
  "مؤسسه",
  "شركة",
  "شركه",
  "مؤسسة",
  "establishment",
  "company",
  "co",
  "ltd",
  "llc",
  "للتجارة",
  "للمقاولات",
  "التجارية",
  "العقارية",
  "والمقاولات",
  "والتجارة",
]);

export function normalizeArabicName(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(text: string): string[] {
  return normalizeArabicName(text)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !COMMON_NAME_STOPWORDS.has(t));
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalizeArabicName(a);
  const nb = normalizeArabicName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;

  const tokensA = nameTokens(a);
  const tokensB = nameTokens(b);
  if (!tokensA.length || !tokensB.length) return 0;

  let hits = 0;
  for (const token of tokensA) {
    if (tokensB.some((other) => other === token || other.includes(token) || token.includes(other))) {
      hits += 1;
    }
  }
  return hits / Math.max(tokensA.length, tokensB.length, 1);
}

export function formatNameMatchScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function normalizeSaudiVat(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidSaudiVat(value: string): boolean {
  const digits = normalizeSaudiVat(value);
  return /^3\d{13}3$/.test(digits);
}

export function normalizeNationalAddress(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidNationalAddressShortCode(value: string): boolean {
  return /^[A-Z]{4}\d{4}$/.test(normalizeNationalAddress(value));
}

export function isValidNationalAddress(value: string): boolean {
  const compact = normalizeNationalAddress(value);
  if (isValidNationalAddressShortCode(compact)) return true;
  // Full national address often includes 4-digit postal code + city/district text
  const hasPostal = /\b\d{4,5}\b/.test(value);
  const hasArabicText = /[\u0600-\u06FF]{3,}/.test(value);
  return value.trim().length >= 12 && hasPostal && hasArabicText;
}

export function isValidSaudiIban(value: string): boolean {
  return /^SA\d{22}$/i.test(value.trim());
}

function checkNameMatch(
  id: string,
  label: string,
  leftLabel: string,
  rightLabel: string,
  left: string,
  right: string,
  critical = true
): IdentityCheck {
  const score = nameSimilarity(left, right);
  if (score >= 0.75) {
    return {
      id,
      label,
      status: "pass",
      detail: `✅ ${leftLabel} يطابق ${rightLabel} (${formatNameMatchScore(score)})`,
    };
  }
  if (score >= 0.5) {
    return {
      id,
      label,
      status: critical ? "warn" : "pass",
      detail: `⚠️ ${leftLabel} قريب من ${rightLabel} (${formatNameMatchScore(score)}) — راجع المستند`,
    };
  }
  return {
    id,
    label,
    status: critical ? "fail" : "warn",
    detail: `❌ ${leftLabel} لا يطابق ${rightLabel} (${formatNameMatchScore(score)})`,
  };
}

export function runSupplierIdentityVerification(
  input: IdentityVerificationInput
): IdentityVerificationResult {
  const checks: IdentityCheck[] = [];

  checks.push(
    checkNameMatch(
      "establishment_vs_cr",
      "اسم السجل التجاري",
      "اسم المنشأة المسجل",
      "اسم السجل في المستند",
      input.establishment_name,
      input.cr_name_on_document
    )
  );

  checks.push(
    checkNameMatch(
      "establishment_vs_iban",
      "اسم الحساب البنكي",
      "اسم المنشأة المسجل",
      "اسم الحساب في خطاب البنك",
      input.establishment_name,
      input.iban_account_name
    )
  );

  checks.push(
    checkNameMatch(
      "cr_vs_iban",
      "السجل والبنك",
      "اسم السجل في المستند",
      "اسم الحساب في خطاب البنك",
      input.cr_name_on_document,
      input.iban_account_name,
      false
    )
  );

  const crDigits = input.cr_number.replace(/\D/g, "");
  if (/^\d{10,15}$/.test(crDigits)) {
    checks.push({
      id: "cr_number_format",
      label: "رقم السجل",
      status: "pass",
      detail: `✅ رقم السجل التجاري بصيغة صحيحة (${crDigits})`,
    });
  } else {
    checks.push({
      id: "cr_number_format",
      label: "رقم السجل",
      status: "fail",
      detail: "❌ رقم السجل التجاري غير صحيح",
    });
  }

  const vat = normalizeSaudiVat(input.tax_number);
  if (isValidSaudiVat(vat)) {
    checks.push({
      id: "tax_number",
      label: "الرقم الضريبي",
      status: "pass",
      detail: `✅ الرقم الضريبي صحيح (${vat})`,
    });
  } else {
    checks.push({
      id: "tax_number",
      label: "الرقم الضريبي",
      status: "fail",
      detail: "❌ الرقم الضريبي يجب أن يكون 15 رقم يبدأ وينتهي بـ 3",
    });
  }

  if (isValidNationalAddress(input.national_address)) {
    const short = normalizeNationalAddress(input.national_address);
    checks.push({
      id: "national_address",
      label: "العنوان الوطني",
      status: "pass",
      detail: isValidNationalAddressShortCode(short)
        ? `✅ العنوان الوطني (الرمز المختصر ${short})`
        : "✅ العنوان الوطني بصيغة مقبولة",
    });
  } else {
    checks.push({
      id: "national_address",
      label: "العنوان الوطني",
      status: "fail",
      detail: "❌ العنوان الوطني غير صحيح — أدخل الرمز المختصر (مثل RRRD2929) أو العنوان الكامل مع الرمز البريدي",
    });
  }

  if (isValidSaudiIban(input.iban)) {
    checks.push({
      id: "iban_format",
      label: "IBAN",
      status: "pass",
      detail: `✅ IBAN سعودي صحيح (${input.iban.toUpperCase()})`,
    });
  } else {
    checks.push({
      id: "iban_format",
      label: "IBAN",
      status: "fail",
      detail: "❌ IBAN غير صحيح — يجب أن يبدأ بـ SA ويتكون من 24 حرفاً",
    });
  }

  const criticalIds = new Set([
    "establishment_vs_cr",
    "establishment_vs_iban",
    "cr_number_format",
    "tax_number",
    "national_address",
    "iban_format",
  ]);

  const criticalChecks = checks.filter((c) => criticalIds.has(c.id));
  const failedCritical = criticalChecks.filter((c) => c.status === "fail");
  const warnedCritical = criticalChecks.filter((c) => c.status === "warn");
  const allCriticalPassed = failedCritical.length === 0;

  const passCount = checks.filter((c) => c.status === "pass").length;
  const matchScore = Math.round((passCount / checks.length) * 100);

  let verificationStatus: IdentityVerificationResult["verificationStatus"] = "Verified";
  if (failedCritical.length > 0) verificationStatus = "Failed";
  else if (warnedCritical.length > 0) verificationStatus = "Needs More Information";

  const summaryLines = [
    "── تحقق الهوية والمطابقة (قواعد ثابتة) ──",
    `اسم المنشأة: ${input.establishment_name}`,
    `السجل في المستند: ${input.cr_name_on_document}`,
    `الحساب في البنك: ${input.iban_account_name}`,
    `الرقم الضريبي: ${vat || "—"}`,
    `العنوان الوطني: ${input.national_address}`,
    "",
    ...checks.map((c) => c.detail),
    "",
    `نتيجة المطابقة: ${matchScore}% | الحالة: ${verificationStatus}`,
  ];

  return {
    checks,
    matchScore,
    allCriticalPassed,
    verificationStatus,
    summaryLines,
  };
}

export function identityVerificationErrorMessage(result: IdentityVerificationResult): string | null {
  const failures = result.checks.filter((c) => c.status === "fail");
  if (!failures.length) return null;
  return failures.map((c) => c.detail.replace(/^❌\s*/, "")).join(" · ");
}