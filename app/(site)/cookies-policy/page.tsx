import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "Cookies policy for Build website and registration workflow."
};

export default function CookiesPolicyPage() {
  return (
    <main className="py-16">
      <Container className="max-w-4xl">
        <h1 className="type-section-title text-brand-dark">Cookies Policy</h1>
        <p className="type-body mt-5 text-brand-dark/80">
          Build uses essential cookies for session continuity, security controls, and performance analytics. We do not use non-essential trackers without transparent notice.
        </p>
        <p className="type-body mt-4 text-brand-dark/80">
          Users can manage browser cookie preferences, but disabling required cookies may affect registration functionality and account access.
        </p>
      </Container>
    </main>
  );
}
