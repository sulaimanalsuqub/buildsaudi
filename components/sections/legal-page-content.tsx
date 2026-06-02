import { Container } from "@/components/ui/container";

type LegalPageContentProps = {
  title: string;
  badge?: string;
  isRtl?: boolean;
  children: React.ReactNode;
};

export function LegalPageContent({ title, badge, isRtl = false, children }: LegalPageContentProps) {
  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* Page hero */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-2xl">
            {badge && (
              <span className="inline-flex items-center rounded-full border border-brand-primary/25 bg-brand-primary/8 px-4 py-1.5 text-sm font-semibold text-brand-primary">
                {badge}
              </span>
            )}
            <h1 className="type-hero mt-5 text-brand-dark">{title}</h1>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="bg-[#f7f9f6] py-10 md:py-14">
        <Container>
          <article className="mx-auto max-w-[860px] rounded-2xl border border-brand-dark/8 bg-white p-5 sm:p-8 md:p-12">
            <div className="space-y-6">
              {children}
            </div>
          </article>
        </Container>
      </section>

    </main>
  );
}
