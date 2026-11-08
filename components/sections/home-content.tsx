import Link from 'next/link';
import { getMarketing } from '@/lib/dictionaries/marketing';
import { BrandMarquee } from './brand-marquee';
import { Hero, SectionHeading, CategoryCard, categoryIcons, Faq, CtaBand } from '@/components/marketing/sections';
import { SupplyJourney } from '@/components/marketing/supply-journey';

export function HomeContent({ isRtl = false }: { isRtl?: boolean }) {
  const t = getMarketing(isRtl);
  const base = isRtl ? '/ar' : '';
  return <main id="main-content" className="marketing-home" dir={isRtl ? 'rtl' : 'ltr'}>
    <Hero t={t} base={base} />
    <BrandMarquee isRtl={isRtl} />
    <section className="marketing-section" id="catalog"><div className="marketing-container"><SectionHeading title={t.catalogTitle} /><div className="category-grid">{t.categories.map((category, i) => <CategoryCard key={category.id} category={category} Icon={categoryIcons[i]} />)}</div><div className="category-details">{t.categories.map(category => <section id={`category-${category.id}`} key={category.id} aria-label={category.name}><h3>{category.name}</h3><p>{category.products}</p><Link prefetch={false} className="marketing-text-link" href={`${base}/get-quote`}>{t.categoryQuote}</Link></section>)}</div></div></section>
    <SupplyJourney t={t} base={base} />
    <Faq t={t} />
    <CtaBand t={t} base={base} />
  </main>;
}
