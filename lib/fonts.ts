import localFont from "next/font/local";

export const gtAmericaArabic = localFont({
  src: [
    { path: "../app/fonts/GTAmericaArabic-Light.ttf", weight: "300", style: "normal" },
    { path: "../app/fonts/GTAmericaArabic-Regular.ttf", weight: "400", style: "normal" },
    { path: "../app/fonts/GTAmericaArabic-Medium.ttf", weight: "500", style: "normal" },
    { path: "../app/fonts/GTAmericaArabic-Bold.ttf", weight: "700", style: "normal" },
    { path: "../app/fonts/GTAmericaArabic-Black.ttf", weight: "900", style: "normal" },
  ],
  display: "swap",
});
