import { VendorRegisterContent } from "@/components/sections/vendor-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/register",
  title: "Register as a Supplier with Build",
  description: "Register your company to supply building materials and finishes for projects in Saudi Arabia. Add your products and required documents, then submit for review.",
  keywords: [
    "building material supplier registration",
    "construction supplier Saudi Arabia",
    "building materials vendor onboarding",
  ],
});

export default function RegisterPage() {
  return <VendorRegisterContent />;
}
