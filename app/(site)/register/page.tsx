import { VendorRegisterContent } from "@/components/sections/vendor-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/register",
  title: "Become a Building Materials Supplier | Build",
  description:
    "Register your company as a building materials and finishes supplier with Build. Supply opportunities for construction projects across Saudi Arabia.",
  keywords: [
    "building material supplier registration",
    "construction supplier Saudi Arabia",
    "building materials vendor onboarding",
  ],
});

export default function RegisterPage() {
  return <VendorRegisterContent />;
}
