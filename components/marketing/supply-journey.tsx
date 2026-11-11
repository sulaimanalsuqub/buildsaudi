'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'motion/react';
import type { MarketingCopy } from '@/lib/dictionaries/marketing';

/* Delivery-route metaphor: a dotted path is "inked in" as you scroll while a
   package dot travels along it, lighting up each stop. Coordinates are viewBox
   units, so stops sit over the three columns (x = 200 / 600 / 1000 of 1200). */
const ROUTE = 'M 40 90 C 120 30 160 28 200 40 C 340 80 460 95 600 92 C 740 88 860 30 1000 40 C 1080 46 1130 70 1160 85';
const STOPS = [[200, 40], [600, 92], [1000, 40]] as const;

const list = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } } };

export function SupplyJourney({ t }: { t: MarketingCopy }) {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.85', 'end 0.4'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const cx = useMotionValue(40);
  const cy = useMotionValue(90);

  useMotionValueEvent(progress, 'change', (v) => {
    const path = pathRef.current;
    if (!path) return;
    const clamped = Math.max(0, Math.min(1, v));
    const point = path.getPointAtLength(clamped * path.getTotalLength());
    cx.set(point.x);
    cy.set(point.y);
    setActive(clamped > 0.78 ? 3 : clamped > 0.45 ? 2 : clamped > 0.12 ? 1 : 0);
  });

  return <section ref={sectionRef} className="marketing-section project-process" id="how-it-works"><div className="marketing-container"><h2>{t.journeyTitle}</h2><svg className="journey-route" viewBox="0 0 1200 120" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d={ROUTE} className="route-base" /><motion.path ref={pathRef} d={ROUTE} className="route-draw" style={{ pathLength: reduced ? 1 : progress }} />{STOPS.map(([x, y], i) => <circle key={x} cx={x} cy={y} r="6" className="route-stop" data-active={reduced || active > i} />)}{!reduced && <motion.circle r="9" className="route-dot" style={{ cx, cy }} />}</svg><motion.ol variants={list} initial={reduced ? false : 'hidden'} whileInView="show" viewport={{ once: true, amount: 0.3 }}>{t.steps.map((step, index) => <motion.li key={step.title} variants={item} data-active={reduced || active > index}><span className="journey-num" dir="ltr">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.body}</p></motion.li>)}</motion.ol></div></section>;
}
