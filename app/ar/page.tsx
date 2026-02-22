import { Metadata } from "next";

import { HomeContent } from "@/components/sections/home-content";

export const metadata: Metadata = {
  title: "الرئيسية"
};

export default function ArabicHomePage() {
  return <HomeContent isRtl />;
}
