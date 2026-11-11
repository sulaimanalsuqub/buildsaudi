'use client';

import { MotionConfig, motion } from 'motion/react';
import type { MarketingCopy } from '@/lib/dictionaries/marketing';

const list = { hidden: {}, show: { transition: { staggerChildren: 0.18 } } };
const item = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } } };
const bar = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } };
const badge = { hidden: { scale: 0.5, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 16 } } };

export function SupplyJourney({ t }: { t: MarketingCopy }) {
  return <section className="marketing-section project-process" id="how-it-works"><div className="marketing-container"><h2>{t.journeyTitle}</h2><MotionConfig reducedMotion="user"><motion.ol variants={list} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.35 }}>{t.steps.map((step, index) => <motion.li key={step.title} variants={item}><motion.span className="journey-bar" variants={bar} aria-hidden="true" /><motion.span className="journey-num" variants={badge} dir="ltr">{String(index + 1).padStart(2, '0')}</motion.span><h3>{step.title}</h3><p>{step.body}</p></motion.li>)}</motion.ol></MotionConfig></div></section>;
}
