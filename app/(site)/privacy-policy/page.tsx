import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/privacy-policy",
  title: "Privacy Policy | Build Saudi",
  description:
    "How Build handles customer and supplier data when requesting building material supply or registering for services, and our commitment to protecting information under applicable regulations.",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageContent title="Privacy Policy" badge="Policies">
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
    </LegalPageContent>
  );
}