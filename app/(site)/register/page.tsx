import { Metadata } from "next";

import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Vendor Registration",
  description: "Register your construction company as a verified supplier on Build."
};

export default function RegisterPage() {
  return (
    <main className="py-16">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="type-hero text-brand-dark">Vendor Registration</h1>
          <p className="type-subheading mt-4 text-brand-dark/75">
            Submit your profile in a structured multi-step form. The Build team reviews every application for quality and compliance.
          </p>
        </div>
        <VendorRegistrationForm />
      </Container>
    </main>
  );
}
