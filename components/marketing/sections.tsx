import Link from 'next/link';
import { ArrowUpRight, MessageCircle, Bath, LampCeiling, Droplets, Fan, LayoutGrid, Layers, Paintbrush, Droplet, Check, ShieldCheck, Plus, type LucideIcon } from 'lucide-react';
import type { MarketingCopy } from '@/lib/dictionaries/marketing';
import { PhoneMockup, UiMockup } from './mockups';

export const categoryIcons = [Bath, LampCeiling, Droplets, Fan, LayoutGrid, Layers, Paintbrush, Droplet];
export function ActionLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <Link prefetch={false} href={href} className={secondary ? 'build-button build-button-outline' : 'build-button'}>{children}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></Link>;
}
export function Hero({ t, base }: { t: MarketingCopy; base: string }) {
  return <section className="marketing-hero"><div className="marketing-container hero-layout"><div className="hero-copy"><h1>{t.headline}</h1><p className="marketing-lead">{t.lead}</p><div className="hero-actions"><ActionLink href={`${base}/get-quote`}>{t.quote}</ActionLink><a className="build-button build-button-outline" href={`https://wa.me/966553771777?text=${encodeURIComponent(t.waMessage)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} />{t.whatsapp}</a></div><p className="hero-note">{t.heroNote}</p></div><PhoneMockup t={t} /></div></section>;
}
export function SectionHeading({ title, body }: { title: string; body?: string }) {
  return <div className="marketing-heading"><h2>{title}</h2>{body && <p>{body}</p>}</div>;
}
export function StepCard({ step, index, t }: { step: MarketingCopy['steps'][number]; index: number; t: MarketingCopy }) {
  const kinds = ['upload', 'quote', 'delivery'] as const;
  return <li className="step-card reveal"><div className="step-number" dir="ltr">{String(index + 1).padStart(2, '0')}</div><h3>{step.title}</h3><p>{step.body}</p><UiMockup kind={kinds[index]} t={t} /></li>;
}
export function CategoryCard({ category, Icon, t }: { category: MarketingCopy['categories'][number]; Icon: LucideIcon; t: MarketingCopy }) {
  return <a href={`#category-${category.id}`} className="category-card"><Icon size={29} strokeWidth={1.4} aria-hidden="true" /><h3>{category.name}</h3><p>{category.products}</p><span>{t.catalogLink}<ArrowUpRight size={17} className="direction-icon" aria-hidden="true" /></span></a>;
}
export function FeatureShowcase({ t, base }: { t: MarketingCopy; base: string }) {
  const kinds = ['quote', 'warranty', 'delivery', 'network'] as const;
  const links = ['/get-quote', '/warranty', '/track-request', '/register'];
  return <section className="marketing-features marketing-container" id="for-projects">{t.features.map((feature, i) => <div key={feature.title} className={`feature-row reveal ${i % 2 ? 'feature-reverse' : ''}`}><div className="feature-copy"><h2>{feature.title}</h2><p>{feature.body}</p><Link prefetch={false} className="marketing-text-link" href={`${base}${links[i]}`}>{feature.link}<ArrowUpRight size={18} className="direction-icon" /></Link></div><div className={`feature-stage feature-stage-${i}`}><UiMockup kind={kinds[i]} t={t} /></div></div>)}</section>;
}
export function Comparison({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section comparison-section"><div className="marketing-container"><SectionHeading title={t.compareTitle} /><div className="comparison-wrap"><table><caption className="sr-only">{t.compareTitle}</caption><thead><tr><th scope="col">{t.compareAspect}</th><th scope="col">{t.traditional}</th><th scope="col">{t.withBuild}</th></tr></thead><tbody>{t.comparisons.map(([aspect, before, after]) => <tr key={aspect}><th scope="row">{aspect}</th><td>{before}</td><td><span><Check size={18} aria-hidden="true" />{after}</span></td></tr>)}</tbody></table></div><p className="comparison-note">{t.compareNote}</p></div></section>;
}
export function TrustSection({ t, base }: { t: MarketingCopy; base: string }) {
  return <section className="marketing-section"><div className="marketing-container trust-layout"><div className="trust-emblem"><ShieldCheck size={100} strokeWidth={1} aria-hidden="true" /><span>{t.name}</span><p>{t.warrantyDoc}</p></div><div><h2>{t.trustTitle}</h2><p className="marketing-lead">{t.trustBody}</p><ul className="trust-points">{t.trustItems.map(x => <li key={x}><Check size={19} aria-hidden="true" />{x}</li>)}</ul><Link prefetch={false} className="marketing-text-link" href={`${base}/warranty`}>{t.trustLink}<ArrowUpRight size={18} className="direction-icon" /></Link></div></div></section>;
}
export function Testimonials({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section sample-section"><div className="marketing-container"><SectionHeading title={t.testimonialsTitle} body={t.sampleNotice} /><div className="sample-grid">{t.testimonials.map(sample => <figure key={sample.role}><blockquote>{sample.quote}</blockquote><figcaption>{sample.role}</figcaption></figure>)}</div></div></section>;
}
export function Faq({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section" id="faq"><div className="marketing-container faq-layout"><SectionHeading title={t.faqTitle} body={t.faqBody} /><div className="faq-list">{t.faqs.map(item => <details key={item.q}><summary>{item.q}<Plus size={19} aria-hidden="true" /></summary><p>{item.a}</p></details>)}</div></div></section>;
}
export function CtaBand({ t, base }: { t: MarketingCopy; base: string }) {
  return <section className="cta-band"><div className="marketing-container"><div><h2>{t.ctaTitle}</h2><p>{t.ctaBody}</p></div><div><ActionLink href={`${base}/get-quote`}>{t.quote}</ActionLink><p className="cta-track">{t.existing} <Link prefetch={false} href={`${base}/track-request`}>{t.track}</Link></p></div></div></section>;
}
