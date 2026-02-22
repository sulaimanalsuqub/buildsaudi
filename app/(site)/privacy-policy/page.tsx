import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Build construction material supply platform."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="section-pad">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">Privacy Policy</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              Build processes business data to connect suppliers with project supply opportunities and manage delivery workflows. We collect only necessary information, store it securely, and use it for platform operations.
            </p>
            <p className="type-body text-brand-dark/80">
              Companies may request corrections to inaccurate information. Build applies technical and organizational safeguards aligned with Saudi market expectations for secure B2B data handling.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
