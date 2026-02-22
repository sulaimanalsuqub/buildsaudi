import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "Cookies policy for Build website and supply workflow."
};

export default function CookiesPolicyPage() {
  return (
    <main className="section-pad">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">Cookies Policy</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              Build uses essential cookies for session continuity, security controls, and performance analytics. We do not use non-essential trackers without transparent notice.
            </p>
            <p className="type-body text-brand-dark/80">
              Users can manage browser cookie preferences, but disabling required cookies may affect platform functionality and account access.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
