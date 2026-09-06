import { z } from "zod";

// Mirrors the subset of app/api/vendors/register/route.ts's registerSchema that a conversation
// can realistically fill in — email/phone/OTP/legal consent still happen on the real form, BANI
// only pre-fills what it can extract from a free-text chat.
export const BaniExtractionSchema = z.object({
  establishmentName: z.string().nullable(),
  country: z.string().nullable(),
  businessType: z
    .enum(["manufacturer", "authorized_distributor", "distributor", "importer", "exporter", "trader", "service_provider"])
    .nullable(),
  shortDescription: z.string().nullable(),
  brands: z.array(z.string()).default([]),
  /** هل جُمعت معلومات كافية لعرض ملخص واستكمال التسجيل عبر الفورم اليدوي؟ */
  readyToHandOff: z.boolean(),
});

export type BaniExtraction = z.infer<typeof BaniExtractionSchema>;
