const CURRENCY_ALIASES: Record<string, string> = {
  sar: "SAR", sr: "SAR", sars: "SAR", "ر.س": "SAR", "ريال": "SAR", "ريال سعودي": "SAR", "﷼": "SAR",
  usd: "USD", "us$": "USD", "$": "USD", dollar: "USD", dollars: "USD", "دولار": "USD", "دولار أمريكي": "USD",
  eur: "EUR", "€": "EUR", euro: "EUR", euros: "EUR", "يورو": "EUR",
  aed: "AED", "درهم": "AED", "درهم إماراتي": "AED", dirham: "AED",
  gbp: "GBP", "£": "GBP", pound: "GBP", "جنيه": "GBP",
};

/** يوحّد رمز العملة الحر (نص من الاستخلاص) إلى رمز ISO. */
export function normalizeCurrencyCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (/^[A-Za-z]{3}$/.test(value)) return value.toUpperCase();
  return CURRENCY_ALIASES[value.toLowerCase()] ?? null;
}

/**
 * دلالة Odoo: rate = عدد وحدات العملة مقابل وحدة واحدة من عملة الشركة (SAR).
 * لذلك SAR = amount / rate.
 */
export function convertToSar(amount: number, currencyCode: string, rates: Map<string, number>): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const rate = rates.get(currencyCode.toUpperCase());
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round((amount / rate) * 100) / 100;
}
