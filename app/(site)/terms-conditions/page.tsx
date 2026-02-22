import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for Build platform usage."
};

export default function TermsPage() {
  return (
    <main className="section-pad">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">Terms & Conditions</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              By using Build, you confirm the provided company and product information is accurate and authorized. Build may request additional details to validate supply capability and project fit.
            </p>
            <p className="type-body text-brand-dark/80">
              Platform access may be suspended in case of false declarations, misuse, or violations of applicable regulations. These terms may be updated periodically.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
