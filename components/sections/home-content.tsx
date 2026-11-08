import { Check } from 'lucide-react';
import Link from 'next/link';
import { getMarketing } from '@/lib/dictionaries/marketing';
import { BrandMarquee } from './brand-marquee';
import { Hero, SectionHeading, CategoryCard, categoryIcons, FeatureShowcase, Comparison, TrustSection, Faq, CtaBand } from '@/components/marketing/sections';
import { SupplyJourney } from '@/components/marketing/supply-journey';

export function HomeContent({ isRtl = false }: { isRtl?: boolean }) {
  const t = getMarketing(isRtl);
  const base = isRtl ? '/ar' : '';
  return <main id="main-content" className="marketing-home" dir={isRtl ? 'rtl' : 'ltr'}>
    <Hero t={t} base={base} />
    <BrandMarquee isRtl={isRtl} />
    <div className="benefit-strip marketing-container">{t.benefits.map(benefit => <p key={benefit}><Check size={19} aria-hidden="true" />{benefit}</p>)}</div>
    <SupplyJourney t={t} base={base} />
    <section className="marketing-section" id="catalog"><div className="marketing-container"><SectionHeading title={t.catalogTitle} body={t.catalogBody} /><div className="category-grid">{t.categories.map((category, i) => <CategoryCard key={category.id} category={category} Icon={categoryIcons[i]} t={t} />)}</div><div className="category-details">{t.categories.map(category => <section id={`category-${category.id}`} key={category.id} aria-label={category.name}><h3>{category.name}</h3><p>{category.products}</p><Link prefetch={false} className="marketing-text-link" href={`${base}/get-quote`}>{t.categoryQuote}</Link></section>)}</div></div></section>
    <FeatureShowcase t={t} base={base} />
    <Comparison t={t} />
    <TrustSection t={t} base={base} />
    <Faq t={t} />
    <CtaBand t={t} base={base} />
  </main>;
}
