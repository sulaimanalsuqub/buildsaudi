import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

export const arabicFont = IBM_Plex_Sans_Arabic({ weight: ["400", "600"], subsets: ["arabic", "latin"], preload: false, display: "swap", variable: "--font-arabic" });
export const latinFont = IBM_Plex_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], preload: false, display: "swap", variable: "--font-latin" });
// Preserve the import contract of existing layouts and error pages.
export const gtAmericaArabic = { className: `${arabicFont.variable} ${latinFont.variable} build-font` };
