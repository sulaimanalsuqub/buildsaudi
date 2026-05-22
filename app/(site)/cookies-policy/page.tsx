import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "Cookies policy for Build supplier and request workflows."
};

export default function CookiesPolicyPage() {
  return (
    <main className="section-pad">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">Cookies Policy</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              Build uses essential cookies to keep sessions active, protect forms, and remember basic preferences. We may also use analytics cookies to understand usage and improve the service when such use is disclosed.
            </p>
            <p className="type-body text-brand-dark/80">
              You can manage cookies through your browser settings. Disabling essential cookies may affect form submission, login, or other core site functions.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
