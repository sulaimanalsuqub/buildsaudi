import Link from "next/link";

import { Container } from "@/components/ui/container";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isRtl?: boolean;
  backLabel?: string;
};

export function AuthShell({ title, subtitle, children, isRtl = false, backLabel = "Back to Home" }: AuthShellProps) {
  return (
    <main className="section-pad min-h-[calc(100vh-74px)]" dir={isRtl ? "rtl" : "ltr"}>
      <Container>
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-8 flex items-center justify-between">
            <Link href={isRtl ? "/ar" : "/"} className="type-small font-semibold text-brand-dark/70 transition-colors hover:text-brand-dark">
              {backLabel}
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <section className="space-y-6">
              <p className="type-small inline-flex rounded-full border border-brand-dark/15 bg-white/70 px-4 py-1.5 font-semibold text-brand-dark/75">
                {isRtl ? "بيلد — الدخول" : "Build Auth"}
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
