import type { MarketingCopy } from '@/lib/dictionaries/marketing';

export function SupplyJourney({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section project-process" id="how-it-works"><div className="marketing-container"><h2>{t.journeyTitle}</h2><ol>{t.steps.map((step, index) => <li key={step.title}><span dir="ltr">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol></div></section>;
}
