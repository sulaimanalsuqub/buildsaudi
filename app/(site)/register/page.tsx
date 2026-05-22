import { Metadata } from "next";

import { VendorRegisterContent } from "@/components/sections/vendor-register-content";

export const metadata: Metadata = {
  title: "Start Supplying",
  description: "Join Build to supply your building materials to active projects faster."
};

export default function RegisterPage() {
  return <VendorRegisterContent />;
}
