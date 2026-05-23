import { Metadata } from "next";

import { LegalPageContent } from "@/components/sections/legal-page-content";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "Cookies policy for Build supplier and request workflows.",
};

export default function CookiesPolicyPage() {
  return (
    <LegalPageContent title="Cookies Policy" badge="Policies">
      <p className="type-body text-brand-dark/80">
        Build uses essential cookies to keep sessions active, protect forms, and remember basic preferences. We may also use analytics cookies to understand usage and improve the service when such use is disclosed.
      </p>
      <p className="type-body text-brand-dark/80">
        You can manage cookies through your browser settings. Disabling essential cookies may affect form submission, login, or other core site functions.
      </p>
    </LegalPageContent>
  );
}
