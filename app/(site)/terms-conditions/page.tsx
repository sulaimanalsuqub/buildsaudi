import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/terms-conditions",
  title: "Terms & Conditions | Build Saudi",
  description:
    "Terms governing the use of Build's platform for building material supply requests and supplier/carrier registration across Saudi Arabia.",
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="type-section-title !mt-10 text-brand-dark first:!mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-brand-dark/80">{children}</p>;
}

export default function TermsPage() {
  return (
    <LegalPageContent title="Terms & Conditions" badge="Policies">
      <P>
        These Terms &amp; Conditions govern your relationship with Local Supplies (&quot;Build&quot;) when using our platform to request building material supply, or to register as a supplier or carrier. By using the platform, you agree to these terms.
      </P>

      <H2>1. Nature of the Service</H2>
      <P>
        Build is an intermediary platform connecting building material supply requests with qualified suppliers and carriers. Every request or registration is reviewed internally before any final approval or matching; submitting a request or registering does not automatically obligate Build to fulfill or accept it.
      </P>

      <H2>2. Registration &amp; Qualification</H2>
      <P>
        Supplier and carrier registration proceeds through stages: initial registration, preliminary approval, profile and document completion, and final review. Build&apos;s team may request additional information, or reject or suspend any registration at any stage, notifying you where appropriate.
      </P>

      <H2>3. Your Obligations</H2>
      <P>By using the platform, you represent and warrant that:</P>
      <ul className="list-disc space-y-2 pl-5 type-body text-brand-dark/80">
        <li>All data and documents you submit are accurate, current, and not misleading.</li>
        <li>You have the legal authority to submit this data on behalf of the business you represent.</li>
        <li>You will not use the platform for any purpose that violates applicable Saudi law.</li>
      </ul>

      <H2>4. Requests &amp; Pricing</H2>
      <P>
        Prices and quotes provided through the platform are subject to review by Build&apos;s team before final confirmation with the customer. No preliminary or estimated pricing information constitutes a binding offer until formally confirmed by Build.
      </P>

      <H2>5. Limitation of Liability</H2>
      <P>
        Build makes reasonable efforts to verify the eligibility of registered suppliers and carriers, but does not guarantee the quality of materials or services provided by third parties, and is not liable for indirect or consequential damages arising from use of the platform, to the extent permitted by applicable law.
      </P>

      <H2>6. Intellectual Property</H2>
      <P>
        All intellectual property rights related to the platform (design, branding, content) belong to Build and may not be copied or used without prior written permission.
      </P>

      <H2>7. Data Protection</H2>
      <P>
        Processing of your personal data is governed by our <a href="/privacy-policy" className="font-semibold text-brand-primary hover:underline">Privacy Policy</a>, which aligns with Saudi Arabia&apos;s Personal Data Protection Law and SDAIA guidance.
      </P>

      <H2>8. Suspension or Termination of Access</H2>
      <P>
        Build may suspend or terminate your access to the platform for inaccurate information, misuse, or violation of these terms or applicable law.
      </P>

      <H2>9. Governing Law &amp; Disputes</H2>
      <P>
        These terms are governed by and construed in accordance with the laws of Saudi Arabia, and the competent Saudi courts have jurisdiction over any dispute arising from them.
      </P>

      <H2>10. Changes to These Terms</H2>
      <P>
        We may update these terms from time to time; the latest version will be posted on this page with the last-updated date. Continued use of the platform after an update constitutes acceptance of the revised terms.
      </P>
      <P>Last updated: July 2026.</P>
    </LegalPageContent>
  );
}
