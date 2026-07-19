import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/cookies-policy",
  title: "Cookies Policy | Build Saudi",
  description:
    "The types of cookies used on the Build website, their purpose, and how to manage your preferences, in line with Saudi data protection requirements.",
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

export default function CookiesPolicyPage() {
  return (
    <LegalPageContent title="Cookies Policy" badge="Policies">
      <P>
        Build uses cookies to run the website and improve your experience. This policy explains the types of cookies we use and their purpose, in line with the Personal Data Protection Law.
      </P>

      <H2>1. Essential Cookies</H2>
      <P>
        Necessary for the site to function and cannot be disabled. Used to maintain your session while filling out registration or supply-request forms, protect forms from abuse, and remember basic preferences. Disabling these breaks form submission and core site functionality.
      </P>

      <H2>2. Analytics Cookies</H2>
      <P>
        We use analytics tools such as Google Analytics (via Google Tag Manager) to understand how visitors use the site and improve the service. These are not essential to the site&apos;s operation and are used with your consent.
      </P>

      <H2>3. Security Cookies</H2>
      <P>
        We use Cloudflare Turnstile to verify that form submissions come from real people rather than automated bots — an essential part of protecting your data and the platform from abuse.
      </P>

      <H2>4. Managing Your Preferences</H2>
      <P>
        You can manage or disable non-essential cookies through your browser settings. Disabling essential cookies may affect your ability to submit forms or use core site features.
      </P>

      <H2>5. Third-Party Providers</H2>
      <Ul>
        <li><strong>Google (Tag Manager / Analytics):</strong> site usage analytics.</li>
        <li><strong>Cloudflare (Turnstile):</strong> protection against automated abuse.</li>
      </Ul>

      <P>For questions about cookies, email cs@build.sa. Last updated: July 2026.</P>
    </LegalPageContent>
  );
}
