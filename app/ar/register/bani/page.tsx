import type { Metadata } from "next";
import { VendorRegisterContent } from "@/components/sections/vendor-register-content";

export const metadata: Metadata = {
  title: "BANI | قريباً",
  robots: { index: false, follow: true },
};

export default function BaniRegistrationPage() {
  return <VendorRegisterContent isRtl />;
}
