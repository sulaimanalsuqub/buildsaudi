import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Build supplier and project request workflows."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="section-pad">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">Privacy Policy</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              Build collects only the information needed to register suppliers, receive project requests, review eligibility, and manage communications. This follows the Saudi data privacy principle of collecting the minimum data required for a defined purpose.
            </p>
            <p className="type-body text-brand-dark/80">
              We may collect company name, contact details, commercial registration details, product categories, delivery information, uploaded files, and basic website usage data. We use this data to operate the service, improve response quality, and maintain security.
            </p>
            <p className="type-body text-brand-dark/80">
              We do not disclose personal or business data except where needed to deliver the service, comply with law, or with appropriate notice and authority. You may request access, correction, or updates to inaccurate information by contacting us.
            </p>
            <p className="type-body text-brand-dark/80">
              We retain data only for as long as needed for the stated purpose, apply reasonable technical and organizational safeguards, and may update this notice when our processing practices change.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
