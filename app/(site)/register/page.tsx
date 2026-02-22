import { Metadata } from "next";

import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Start Supplying",
  description: "Join Build to supply your building materials to active projects faster."
};

export default function RegisterPage() {
  return (
    <main className="py-16">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="type-section-title text-brand-dark">Start Supplying Your Products</h1>
          <p className="type-subheading mt-4 text-brand-dark/75">
            Share your company and product information to receive matching supply opportunities from active projects.
          </p>
        </div>
        <VendorRegistrationForm />
      </Container>
    </main>
  );
}
