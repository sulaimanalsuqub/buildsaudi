import { CarrierRegisterPausedContent } from "@/components/sections/carrier-register-paused-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/carriers/register",
  title: "سجّل كناقل لدى بيلد",
  description: "سجّل منشأتك كناقل لدى بيلد لنقل مواد البناء إلى المشاريع في السعودية. أضف بياناتك وخدماتك ومناطق التغطية والمستندات المطلوبة وقدّم طلبك للمراجعة.",
  keywords: ["تسجيل ناقل مواد بناء", "شريك نقل مواد بناء", "شركة شحن مواد بناء السعودية"],
});

export default function ArabicCarrierRegisterPage() {
  return <CarrierRegisterPausedContent isRtl />;
}
