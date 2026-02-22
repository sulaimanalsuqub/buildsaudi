import Link from "next/link";

import { Container } from "@/components/ui/container";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="section-pad min-h-[calc(100vh-74px)]">
      <Container>
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="type-small font-semibold text-brand-dark/70 transition-colors hover:text-brand-dark">
              Back to Home
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <section className="space-y-6">
              <p className="type-small inline-flex rounded-full border border-brand-dark/15 bg-white/70 px-4 py-1.5 font-semibold text-brand-dark/75">
                Build Auth
              </p>
              <h1 className="type-section-title text-brand-dark">{title}</h1>
              <p className="type-subheading text-brand-dark/80">{subtitle}</p>
            </section>

            <section>{children}</section>
          </div>
        </div>
      </Container>
    </main>
  );
}
