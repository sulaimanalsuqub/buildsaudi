import Link from 'next/link';
import { ArrowUpRight, FileUp, PackageCheck, ShieldCheck, MessageCircle } from 'lucide-react';
import { getMarketing } from '@/lib/dictionaries/marketing';
import { BrandMarquee } from './brand-marquee';
import { categoryIcons, Faq, CtaBand } from '@/components/marketing/sections';
import { SupplyJourney } from '@/components/marketing/supply-journey';

export function HomeContent({ isRtl = false }: { isRtl?: boolean }) {
  const t = getMarketing(isRtl);
  const base = isRtl ? '/ar' : '';
  return (
    <main id="main-content" className="marketing-home project-home materials-home" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="materials-hero" id="for-projects">
        <div className="marketing-container">
          <div className="materials-intro">
            <h1>{isRtl ? 'احتياجات مشروعك،' : 'Your project materials,'}<br /><span>{isRtl ? 'من هنا لموقعك.' : 'from here to your location.'}</span></h1>
            <p>{t.projectLead}</p>
          </div>
          <div id="catalog" className="materials-catalog" aria-labelledby="materials-title">
            <div className="materials-catalog-heading"><h2 id="materials-title">{t.catalogTitle}</h2><a href="#how-it-works">{t.how}<ArrowUpRight size={16} className="direction-icon" aria-hidden="true" /></a></div>
            <div className="materials-grid">
              <Link href={`${base}/get-quote`} className="materials-start" prefetch={false}>
                <FileUp size={40} strokeWidth={1.3} aria-hidden="true" />
                <h2>{t.boqTitle}</h2><p>{t.boqBody}</p>
                <span className="materials-start-action">{t.quote}<ArrowUpRight size={20} className="direction-icon" aria-hidden="true" /></span>
                <small>{t.boqFormats}</small>
              </Link>
              {t.categories.map((category, index) => {
                const Icon = categoryIcons[index];
                return <Link key={category.id} id={`category-${category.id}`} href={`${base}/get-quote#materials-heading`} prefetch={false} className={`material-tile material-tile-${index}`}>
                  <div className="material-tile-heading"><h3>{category.name}</h3><ArrowUpRight size={20} className="direction-icon" aria-hidden="true" /></div>
                  <p>{category.products}</p>
                  <Icon className="material-tile-icon" size={64} strokeWidth={1.2} aria-hidden="true" />
                  <span className="material-tile-action">{t.categoryQuote}</span>
                </Link>;
              })}
            </div>
          </div>
          <div className="materials-help"><span>{t.existing} <Link href={`${base}/track-request`}>{t.track}</Link></span><a href={`https://wa.me/966553771777?text=${encodeURIComponent(t.waMessage)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" />{t.whatsapp}</a></div>
        </div>
      </section>
      <BrandMarquee isRtl={isRtl} />
      <SupplyJourney t={t} />
      <section className="materials-service marketing-container" aria-label={isRtl ? 'خدمات بيلد' : 'Build services'}>
        <Link href={`${base}/warranty`} className="materials-service-link"><ShieldCheck size={34} strokeWidth={1.4} aria-hidden="true" /><div><h2>{isRtl ? 'وضوح قبل الاعتماد' : 'Clarity before approval'}</h2><p>{t.warrantyNote}</p><span>{t.trustLink}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></span></div></Link>
        <Link href={`${base}/register`} className="materials-service-link"><PackageCheck size={34} strokeWidth={1.4} aria-hidden="true" /><div><h2>{t.features[3].title}</h2><p>{t.features[3].body}</p><span>{t.features[3].link}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></span></div></Link>
      </section>
      <Faq t={t} />
      <CtaBand t={t} base={base} />
    </main>
  );
}
