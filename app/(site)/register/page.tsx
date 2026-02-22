import { Metadata } from "next";

import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Start Supplying",
  description: "Join Build to supply your building materials to active projects faster."
};

export default function RegisterPage() {
  return (
    <main className="section-pad">
      <Container className="content-stack">
        <div className="mx-auto max-w-[900px] text-center">
          <h1 className="type-section-title mx-auto text-brand-dark">Start Supplying Your Products</h1>
          <p className="type-subheading mx-auto mt-6 text-brand-dark/80">
            Share your company and product information to receive matching supply opportunities from active projects.
          </p>
        </div>
        <VendorRegistrationForm />
      </Container>
    </main>
  );
}
