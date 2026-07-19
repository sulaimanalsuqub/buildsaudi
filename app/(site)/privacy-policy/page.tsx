import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/privacy-policy",
  title: "Privacy Policy | Build Saudi",
  description:
    "Build's privacy policy, aligned with Saudi Arabia's Personal Data Protection Law (PDPL) and SDAIA guidance, covering what data we collect from suppliers, carriers, and customers, why, and your rights.",
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="type-section-title !mt-10 text-brand-dark first:!mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-brand-dark/80">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 type-body text-brand-dark/80">{children}</ul>;
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageContent title="Privacy Policy" badge="Policies">
      <P>
        Local Supplies (&quot;Build&quot;) is committed to protecting the personal data of its customers, suppliers, and carriers under Saudi Arabia&apos;s Personal Data Protection Law (PDPL, Royal Decree M/19) and its implementing regulations issued by the Saudi Data and AI Authority (SDAIA). This policy explains what data we collect, why, and your rights over it.
      </P>

      <H2>1. Data We Collect</H2>
      <P>We collect data based on how you use the platform:</P>
      <Ul>
        <li><strong>Suppliers &amp; carriers:</strong> contact name, job title, email (verified via OTP), mobile number, establishment name, country, commercial registration number, material categories or transport services, bank account details (IBAN), and uploaded documents (commercial registration, bank letter, registration certificates).</li>
        <li><strong>Customers (supply requests):</strong> contact and company name, email (verified), mobile number, project name, delivery location (national address short code or city/district), item details, and attached files (bills of quantities, drawings).</li>
        <li><strong>Technical data:</strong> IP address for abuse prevention (e.g. Cloudflare Turnstile verification), and basic site usage data.</li>
      </Ul>

      <H2>2. Purpose &amp; Legal Basis</H2>
      <P>We process your data under one of the following legal bases recognized by the PDPL:</P>
      <Ul>
        <li><strong>Contract performance / your request:</strong> registering suppliers and carriers, processing supply requests, and issuing quotes.</li>
        <li><strong>Legitimate interest:</strong> identity verification via OTP, protection against automated abuse (bots), and preventing duplicate registrations.</li>
        <li><strong>Consent:</strong> non-essential analytics cookies (see our Cookies Policy).</li>
        <li><strong>Legal obligation:</strong> retaining commercial and accounting records as required under applicable Saudi law.</li>
      </Ul>

      <H2>3. Sharing Data with Third Parties</H2>
      <P>
        We do not sell your data. We share the minimum necessary data with trusted service providers acting on our behalf, including: our ERP provider (Odoo) for storing registration and request records, our email provider (Resend) for sending verification codes and notifications, and Cloudflare for protection against automated abuse. These providers are contractually bound to process data only for the purposes we specify.
      </P>

      <H2>4. Cross-Border Data Transfer</H2>
      <P>
        Some data may be hosted or processed by technology providers with data centers outside Saudi Arabia, within the exceptions permitted by the PDPL when necessary to deliver the service you requested, and with appropriate contractual and technical safeguards providing a level of protection equivalent to Saudi requirements.
      </P>

      <H2>5. Data Retention</H2>
      <P>
        We retain your data for as long as necessary to fulfill the purpose it was collected for, or as required by applicable Saudi laws (such as tax and commercial regulations), whichever is longer. Afterward, data is securely deleted or anonymized.
      </P>

      <H2>6. Data Security</H2>
      <P>
        We apply appropriate technical and organizational safeguards, including: email verification via OTP, protection against automated requests via Cloudflare Turnstile, encrypted connections (HTTPS), and access restricted to authorized personnel on a need-to-know basis.
      </P>

      <H2>7. Your Rights Under the PDPL</H2>
      <P>Under the Personal Data Protection Law and its regulations, you have the right to:</P>
      <Ul>
        <li>Obtain a copy of your personal data held by us.</li>
        <li>Request correction of inaccurate or incomplete data.</li>
        <li>Request destruction of data no longer legally required to be retained.</li>
        <li>Withdraw consent to any consent-based processing (such as analytics cookies) at any time.</li>
        <li>Lodge a complaint with the Saudi Data &amp; AI Authority (SDAIA) if you believe we have not complied with the law.</li>
      </Ul>
      <P>To exercise any of these rights, email us at cs@build.sa.</P>

      <H2>8. Cookies</H2>
      <P>
        We use essential and analytics cookies — full details are in our <a href="/cookies-policy" className="font-semibold text-brand-primary hover:underline">Cookies Policy</a>.
      </P>

      <H2>9. Updates to This Policy</H2>
      <P>
        We may update this policy as our processing practices or applicable regulations change. Material updates will be posted on this page along with the last-updated date.
      </P>
      <P>Last updated: July 2026.</P>
    </LegalPageContent>
  );
}
