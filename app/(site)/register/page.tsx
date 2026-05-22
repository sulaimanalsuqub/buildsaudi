import { Metadata } from "next";

import { VendorRegisterContent } from "@/components/sections/vendor-register-content";

export const metadata: Metadata = {
  title: "Become a Supplier",
  description: "Register your company with Build to receive qualified project RFQs."
};

export default function RegisterPage() {
  return <VendorRegisterContent />;
}
