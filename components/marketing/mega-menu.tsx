'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';
import { getMarketing } from '@/lib/dictionaries/marketing';

export function MegaMenu({ isRtl = false }: { isRtl?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const t = getMarketing(isRtl);
  const home = isRtl ? '/ar' : '/';
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return <div ref={root} className="mega-root" onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="mega-trigger" aria-expanded={open} aria-controls="materials-menu" onClick={() => setOpen(!open)}><span className="desktop-menu-label">{t.materials}</span><span className="mobile-menu-label">{open ? <X size={21} /> : <Menu size={21} />}<span className="sr-only">{open ? t.close : t.menu}</span></span><ChevronDown size={15} className="desktop-menu-label" /></button>
    {open && <div className="mega-panel" id="materials-menu"><div><strong>{t.materials}</strong><div className="mega-categories">{t.categories.map(category => <Link key={category.id} href={`${home}#category-${category.id}`} onClick={() => setOpen(false)}><span>{category.name}<small>{category.products}</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>)}</div></div><div className="mega-aside"><Link href={`${home}#how-it-works`} onClick={() => setOpen(false)}>{t.how}</Link><Link href={`${home}#for-projects`} onClick={() => setOpen(false)}>{t.audience}</Link><Link href={`${isRtl ? '/ar' : ''}/track-request`} onClick={() => setOpen(false)}>{t.track}</Link><Link href={`${isRtl ? '/ar' : ''}/register`} onClick={() => setOpen(false)}>{t.features[3].link}</Link></div></div>}
  </div>;
}
