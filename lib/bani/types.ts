export type BaniLanguage = "ar" | "en" | "zh" | "ur";

export type BaniDirection = "rtl" | "ltr";

export type BaniMessageRole = "user" | "assistant";

export type BaniMessage = {
  id: string;
  role: BaniMessageRole;
  content: string;
};

export type BaniAttachment = {
  name: string;
  type: string;
  size: number;
};

export const baniDirections: Record<BaniLanguage, BaniDirection> = {
  ar: "rtl",
  en: "ltr",
  zh: "ltr",
  ur: "rtl"
};
