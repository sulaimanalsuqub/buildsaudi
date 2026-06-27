import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/terms-conditions",
  title: "Terms & Conditions | Build Saudi",
  description:
    "Terms governing the use of Build services for building material supply requests and supplier registration across Saudi Arabia.",
});

export default function TermsPage() {
  return (
    <LegalPageContent title="Terms & Conditions" badge="Policies">
      <p className="type-body text-brand-dark/80">
        By using Build, you confirm that the company information and uploaded materials are accurate, current, and submitted by someone authorized to act for the business.
      </p>
      <p className="type-body text-brand-dark/80">
        Build may request additional information to verify supplier eligibility, project fit, and delivery coverage. We may suspend access for false statements, misuse, or violations of applicable law.
      </p>
      <p className="type-body text-brand-dark/80">
        These terms are governed by the laws applicable in Saudi Arabia, including the Personal Data Protection Law and related regulatory requirements. We may update these terms from time to time, and the latest version will be posted on this site.
      </p>
    </LegalPageContent>
  );
}