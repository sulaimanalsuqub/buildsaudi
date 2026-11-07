import { Check, CheckCheck, FileText, UploadCloud, ShieldCheck, Truck, PackageCheck, ArrowDown, Send, Phone } from 'lucide-react';
import type { MarketingCopy } from '@/lib/dictionaries/marketing';

export function PhoneMockup({ t }: { t: MarketingCopy }) {
  return <figure className="phone-stage" aria-label={t.phoneLabel}>
    <div className="phone-device">
      <div className="phone-status" dir="ltr"><span>9:41</span><span className="phone-island" /><span aria-hidden="true">••• ▰</span></div>
      <div className="phone-chat-header"><span className="phone-avatar"><PackageCheck size={22} /></span><div><strong>{t.name}</strong><span>{t.chatTeam}</span></div><Phone size={17} aria-hidden="true" /></div>
      <div className="phone-chat">
        <span className="chat-day">{t.today}</span>
        <div className="chat-bubble chat-out"><p>{t.chatRequest}</p><div className="chat-file"><FileText size={25} /><div><strong>{t.file}</strong><span>{t.fileNote}</span></div></div><CheckCheck size={14} className="chat-check" /></div>
        <div className="chat-bubble chat-in"><p>{t.chatReply}</p><div className="chat-quote"><span>{t.quoteDoc}</span><strong dir="ltr">{t.quoteAmount}</strong><small>{t.taxNote}</small></div></div>
        <div className="chat-bubble chat-in"><div className="chat-eta"><Truck size={19} /><strong>{t.eta}</strong></div><small>{t.etaNote}</small></div>
        <div className="chat-bubble chat-out"><p>{t.chatConfirm}</p><CheckCheck size={14} className="chat-check" /></div>
      </div>
      <div className="phone-composer"><span>{t.composer}</span><Send size={17} /></div>
    </div>
    <figcaption>{t.example}</figcaption>
  </figure>;
}

export function UiMockup({ kind, t }: { kind: 'upload' | 'quote' | 'delivery' | 'warranty' | 'network'; t: MarketingCopy }) {
  return <div className={`ui-demo ui-demo-${kind}`}>
    <div className="demo-top"><span className="demo-dot" /><strong>{t.name}</strong><small>{t.example}</small></div>
    {kind === 'upload' && <><div className="demo-upload"><UploadCloud size={32} strokeWidth={1.5} /><strong>{t.upload}</strong><span>{t.uploadNote}</span></div><div className="demo-file"><FileText size={23} /><span>{t.file}</span><Check size={17} /></div><p className="demo-foot"><CheckCheck size={16} />{t.uploaded}</p></>}
    {kind === 'quote' && <><h3>{t.quoteReady}</h3><div className="demo-lines">{t.lineItems.map((x) => <div key={x}><Check size={16} /><span>{x}</span></div>)}</div><div className="demo-total"><span>{t.quoteDoc}</span><strong dir="ltr">{t.quoteAmount}</strong></div><small>{t.taxNote}</small></>}
    {kind === 'delivery' && <><h3>{t.delivery}</h3><ol className="demo-timeline">{t.statuses.map((s, i) => <li key={s} data-active={i === 2}><span>{i < 2 ? <Check size={15} /> : <Truck size={15} />}</span><strong>{s}</strong></li>)}</ol><p className="demo-foot">{t.eta}</p><small>{t.etaNote}</small></>}
    {kind === 'warranty' && <><div className="demo-seal"><ShieldCheck size={62} strokeWidth={1.2} /></div><h3>{t.warrantyDoc}</h3><p>{t.warrantyNote}</p><div className="demo-foot"><CheckCheck size={17} />{t.verified}</div></>}
    {kind === 'network' && <><h3>{t.network}</h3><div className="demo-network">{t.networkNodes.map((n, i) => <div key={n}><span>{n}</span>{i < 3 && <ArrowDown size={18} />}</div>)}</div></>}
  </div>;
}
