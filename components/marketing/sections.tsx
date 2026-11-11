import Link from 'next/link';
import { ArrowUpRight, MessageCircle, Check, ShieldCheck, Plus, FileUp, ArrowDown } from 'lucide-react';
import type { MarketingCopy } from '@/lib/dictionaries/marketing';
import { UiMockup } from './mockups';
import { categoryIcons, type CategoryIcon } from './category-icons';

export { categoryIcons };
export function ActionLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <Link prefetch={false} href={href} className={secondary ? 'build-button build-button-outline' : 'build-button'}>{children}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></Link>;
}
export function Hero({ t, base }: { t: MarketingCopy; base: string }) {
  return <section className="marketing-hero project-hero" id="for-projects"><div className="marketing-container hero-layout"><div className="hero-copy"><h1>{t.projectHeadline}</h1><p className="marketing-lead">{t.projectLead}</p><div className="hero-actions"><ActionLink href={`${base}/get-quote`}>{t.quote}</ActionLink><a className="project-material-link" href="#catalog">{t.materials}<ArrowDown size={17} aria-hidden="true" /></a></div><a className="project-whatsapp" href={`https://wa.me/966553771777?text=${encodeURIComponent(t.waMessage)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" />{t.whatsapp}</a></div><aside className="project-request" aria-labelledby="boq-title"><div className="request-file-heading"><FileUp size={30} strokeWidth={1.3} aria-hidden="true" /><span>{t.boqFormats}</span></div><h2 id="boq-title">{t.boqTitle}</h2><p>{t.boqBody}</p><ul>{t.requestNeeds.map(item => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul><Link prefetch={false} className="project-upload-link" href={`${base}/get-quote#materials-heading`}>{t.boqAction}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></Link><div className="request-track">{t.requestHelp} <Link prefetch={false} href={`${base}/track-request`}>{t.track}</Link></div></aside></div></section>;
}
export function SectionHeading({ title, body }: { title: string; body?: string }) {
  return <div className="marketing-heading"><h2>{title}</h2>{body && <p>{body}</p>}</div>;
}
export function StepCard({ step, index, t }: { step: MarketingCopy['steps'][number]; index: number; t: MarketingCopy }) {
  const kinds = ['upload', 'quote', 'delivery'] as const;
  return <li className="step-card reveal"><div className="step-number" dir="ltr">{String(index + 1).padStart(2, '0')}</div><h3>{step.title}</h3><p>{step.body}</p><UiMockup kind={kinds[index]} t={t} /></li>;
}
export function CategoryCard({ category, Icon }: { category: MarketingCopy['categories'][number]; Icon: CategoryIcon }) {
  return <a href={`#category-${category.id}`} className="category-card"><span className="category-icon"><Icon size={24} strokeWidth={1.6} aria-hidden="true" /></span><div><h3>{category.name}</h3><p>{category.products}</p></div><ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></a>;
}
export function FeatureShowcase({ t, base }: { t: MarketingCopy; base: string }) {
  const kinds = ['quote', 'warranty', 'delivery', 'network'] as const;
  const links = ['/get-quote', '/warranty', '/track-request', '/register'];
  return <section className="marketing-features marketing-container" id="for-projects">{t.features.map((feature, i) => <div key={feature.title} className={`feature-row reveal ${i % 2 ? 'feature-reverse' : ''}`}><div className="feature-copy"><h2>{feature.title}</h2><p>{feature.body}</p><Link prefetch={false} className="marketing-text-link" href={`${base}${links[i]}`}>{feature.link}<ArrowUpRight size={18} className="direction-icon" /></Link></div><div className={`feature-stage feature-stage-${i}`}><UiMockup kind={kinds[i]} t={t} /></div></div>)}</section>;
}
export function Comparison({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section comparison-section sourcing-comparison"><div className="marketing-container"><div className="comparison-intro"><h2>{t.compareHeadline}</h2><p>{t.compareBody}</p></div><div className="comparison-wrap"><table><caption className="sr-only">{t.compareHeadline}</caption><thead><tr><th scope="col">{t.compareAspect}</th><th scope="col">{t.traditional}</th><th scope="col">{t.withBuild}</th></tr></thead><tbody>{t.comparisons.map(([aspect, before, after], index) => <tr key={aspect}><th scope="row"><span className="comparison-index" dir="ltr">{String(index + 1).padStart(2, '0')}</span>{aspect}</th><td data-label={t.traditional}>{before}</td><td data-label={t.withBuild}><span><Check size={18} aria-hidden="true" />{after}</span></td></tr>)}</tbody></table></div><p className="comparison-note">{t.compareNote}</p></div></section>;
}
export function TrustSection({ t, base }: { t: MarketingCopy; base: string }) {
  return <section className="marketing-section supply-assurance"><div className="marketing-container assurance-layout"><div className="assurance-intro"><ShieldCheck size={38} strokeWidth={1.4} aria-hidden="true" /><h2>{t.assuranceTitle}</h2><p className="marketing-lead">{t.trustBody}</p><Link prefetch={false} className="marketing-text-link" href={`${base}/warranty`}>{t.trustLink}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></Link></div><ol className="assurance-list">{t.trustDetails.map((item, index) => <li key={item.title}><span className="assurance-number" dir="ltr">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><Check size={21} aria-hidden="true" /></li>)}</ol></div></section>;
}
export function Testimonials({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section sample-section"><div className="marketing-container"><SectionHeading title={t.testimonialsTitle} body={t.sampleNotice} /><div className="sample-grid">{t.testimonials.map(sample => <figure key={sample.role}><blockquote>{sample.quote}</blockquote><figcaption>{sample.role}</figcaption></figure>)}</div></div></section>;
}
export function Faq({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section" id="faq"><div className="marketing-container faq-layout"><SectionHeading title={t.faqTitle} /><div className="faq-list">{t.faqs.map(item => <details key={item.q}><summary>{item.q}<span><Plus size={16} aria-hidden="true" /></span></summary><p><span>{item.a}</span></p></details>)}</div></div></section>;
}
export function CtaBand({ t, base }: { t: MarketingCopy; base: string }) {
  return <section className="cta-band"><div className="marketing-container"><div><h2>{t.ctaTitle}</h2><p>{t.ctaBody}</p></div><div><ActionLink href={`${base}/get-quote`}>{t.quote}</ActionLink><p className="cta-track">{t.existing} <Link prefetch={false} href={`${base}/track-request`}>{t.track}</Link></p></div></div></section>;
}
