import { VendorRegisterContent } from "@/components/sections/vendor-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/register",
  title: "Building Material Supplier Registration | Build Saudi",
  description:
    "Register your company as a building materials supplier with Build. Project supply opportunities across Saudi Arabia with clear onboarding requirements.",
  keywords: [
    "building material supplier registration",
    "construction supplier Saudi Arabia",
    "building materials vendor onboarding",
  ],
});

export default function RegisterPage() {
  return <VendorRegisterContent />;
}