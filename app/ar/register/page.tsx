import { Metadata } from "next";

import { VendorRegisterContent } from "@/components/sections/vendor-register-content";

export const metadata: Metadata = {
  title: "كُن مورداً",
  description: "انضم إلى بيلد كمورد مؤهل لفرص توريد مواد البناء في السعودية."
};

export default function ArabicRegisterPage() {
  return <VendorRegisterContent isRtl />;
}
