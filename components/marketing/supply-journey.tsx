'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import type { MarketingCopy } from '@/lib/dictionaries/marketing';
import { UiMockup } from './mockups';

export function SupplyJourney({ t, base }: { t: MarketingCopy; base: string }) {
  const [active, setActive] = useState(0);
  const kinds = ['upload', 'quote', 'delivery'] as const;
  return <section className="marketing-section supply-process" id="how-it-works">
    <div className="marketing-container journey-layout">
      <div><h2>{t.journeyTitle}</h2><p className="marketing-lead">{t.journeyBody}</p>
        <ol className="journey-steps">{t.steps.map((step, index) => <li key={step.title} data-active={active === index}>
          <button type="button" onClick={() => setActive(index)} aria-pressed={active === index} aria-controls="journey-preview">
            <span className="journey-number" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
            <span><strong>{step.title}</strong><span className="journey-description">{step.body}</span></span>
            {active === index && <Check size={19} aria-hidden="true" />}
          </button>
        </li>)}</ol>
        <Link prefetch={false} href={`${base}/get-quote`} className="marketing-text-link">{t.quote}<ArrowUpRight size={18} className="direction-icon" aria-hidden="true" /></Link>
      </div>
      <div className="journey-preview" id="journey-preview" role="region" aria-label={t.steps[active].title}>
        <div className="journey-preview-heading"><span>{t.steps[active].title}</span><span dir="ltr">{String(active + 1).padStart(2, '0')} / 03</span></div>
        <UiMockup kind={kinds[active]} t={t} />
        <p>{t.example}</p>
      </div>
    </div>
  </section>;
}
