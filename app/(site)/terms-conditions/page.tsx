import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for Build platform usage."
};

export default function TermsPage() {
  return (
    <main className="py-16">
      <Container className="max-w-4xl">
        <h1 className="type-section-title text-brand-dark">Terms & Conditions</h1>
        <p className="type-body mt-5 text-brand-dark/80">
          By submitting vendor information on Build, you confirm all provided records are accurate and authorized. Build may request additional documentation before final supplier activation.
        </p>
        <p className="type-body mt-4 text-brand-dark/80">
          Platform access may be suspended in case of false declarations, compliance violations, or misuse of procurement communications. These terms may be updated periodically.
        </p>
      </Container>
    </main>
  );
}
