import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for Build supplier and request workflows."
};

export default function TermsPage() {
  return (
    <main className="section-pad">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">Terms & Conditions</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              By using Build, you confirm that the company information and uploaded materials are accurate, current, and submitted by someone authorized to act for the business.
            </p>
            <p className="type-body text-brand-dark/80">
              Build may request additional information to verify supplier eligibility, project fit, and delivery coverage. We may suspend access for false statements, misuse, or violations of applicable law.
            </p>
            <p className="type-body text-brand-dark/80">
              These terms are governed by the laws applicable in Saudi Arabia, including the Personal Data Protection Law and related regulatory requirements. We may update these terms from time to time, and the latest version will be posted on this site.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
