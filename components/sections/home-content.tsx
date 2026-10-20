"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowDown, Bath, Droplet, Droplets, Fan, LampCeiling, Layers, LayoutGrid, Paintbrush } from "lucide-react";

import { Container } from "@/components/ui/container";
import { BrandMarquee } from "@/components/sections/brand-marquee";
import { HowItWorks } from "@/components/sections/how-it-works";

const catalog = [
  { en: "Sanitaryware & Bath Fittings", ar: "الأدوات الصحية", descEn: "Fixtures, faucets & bathroom sets", descAr: "تركيبات ومجموعات الحمام", icon: Bath },
  { en: "Electrical & Lighting", ar: "الكهرباء والإنارة", descEn: "Wiring, fixtures & LED systems", descAr: "أسلاك وتركيبات وأنظمة LED", icon: LampCeiling },
  { en: "Plumbing & Piping Systems", ar: "السباكة وأنظمة الأنابيب", descEn: "Pipes, fittings & valves", descAr: "أنابيب وتركيبات وصمامات", icon: Droplets },
  { en: "HVAC", ar: "التكييف والتهوية", descEn: "AC units, ventilation & ducting", descAr: "وحدات تكييف وتهوية وقنوات", icon: Fan },
  { en: "Tiles & Flooring", ar: "الأرضيات", descEn: "Ceramic, porcelain & stone flooring", descAr: "سيراميك وبورسلين وأرضيات حجرية", icon: LayoutGrid },
  { en: "Wall Finishes & Coverings", ar: "الجداريات", descEn: "Cladding, panels & wall coverings", descAr: "تكسيات وألواح وتغطيات جدارية", icon: Layers },
  { en: "Paints & Coatings", ar: "الدهانات الداخلية والخارجية", descEn: "Interior, exterior & specialty paints", descAr: "دهانات داخلية وخارجية ومتخصصة", icon: Paintbrush },
  { en: "Adhesives, Grouts & Sealants", ar: "اللواصق والمواد المساعدة", descEn: "Adhesives, grouts & sealing solutions", descAr: "لواصق ومواد حشو وعزل", icon: Droplet },
];

export function HomeContent({ isRtl = false }: { isRtl?: boolean }) {
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight;
  const quoteHref = isRtl ? "/ar/get-quote" : "/get-quote";
  const body = isRtl ? "توريد مواد البناء والتشطيب للمقاولين والمطورين" : "Supply of building materials and finishes for contractors and developers";

  return (
    <main className="build-home" dir={isRtl ? "rtl" : "ltr"}>
      <section className="home-hero" aria-labelledby="home-title">
        <Container className="home-hero-layout">
          <div className="home-hero-copy">
            <h1 id="home-title" className="home-title">
              {isRtl ? <>رحلة توريد المواد<br /><span>أسرع</span></> : <>Materials supply,<br /><span>Faster</span></>}
            </h1>
            <p className="home-lead">{body}</p>
            <div className="home-hero-actions">
              <a
                href={`https://wa.me/966553771777?text=${encodeURIComponent(isRtl ? "هلا بيلد، يرجى تزويدي بعرض سعر للأصناف" : "Hi Build, please send me a quote for the following items.")}`}
                target="_blank" rel="noopener noreferrer" className="home-primary-button"
              >
                {isRtl ? "اطلب المنتجات" : "Order products"}<DirectionArrow size={18} aria-hidden="true" />
              </a>
              <a href="#catalog" className="home-text-link">
                {isRtl ? "استكشف المواد" : "Explore materials"}<ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="hero-supply">
            <div className="hero-truck">
              <Image src="/images/build-truck-vendor.png" alt={isRtl ? "شاحنة توريد بيلد" : "Build supply truck"} width={2048} height={1134} priority sizes="(min-width: 1200px) 550px, (min-width: 768px) 46vw, 90vw" />
            </div>
            <p className="hero-supply-caption">{isRtl ? "من احتياجك، إلى أرض مشروعك" : "From your requirements to your site"}</p>
          </div>
        </Container>
      </section>

      <section id="catalog" className="home-catalog home-section" aria-labelledby="catalog-title">
        <Container>
          <div className="home-section-heading">
            <h2 id="catalog-title" className="home-heading">{isRtl ? "المواد اللي نورّدها" : "The materials we move"}</h2>
            <p>{isRtl ? "جميع احتياجات مشروعك" : "Everything your project needs"}</p>
          </div>
          <ul className="home-materials">
            {catalog.map((item) => (
              <li key={item.en}>
                <Link href={quoteHref} className="home-material" aria-label={isRtl ? `${item.ar} — اطلب عرض سعر` : `${item.en} — Request a quote`}>
                  <span className="home-material-icon"><item.icon size={25} strokeWidth={1.5} aria-hidden="true" /></span>
                  <span className="home-material-copy"><span className="home-material-name">{isRtl ? item.ar : item.en}</span><span className="home-material-description">{isRtl ? item.descAr : item.descEn}</span></span>
                  <DirectionArrow className="home-material-arrow" size={19} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="home-catalog-action"><Link href={quoteHref} className="home-text-link">{isRtl ? "اطلب عرض سعر لمشروعك" : "Request a quote for your project"}<DirectionArrow size={17} aria-hidden="true" /></Link></div>
        </Container>
      </section>

      <HowItWorks isRtl={isRtl} />
      <BrandMarquee isRtl={isRtl} />

      <section className="supply-cta" aria-labelledby="supply-cta-title">
        <Container>
          <div className="supply-cta-main">
            <div>
              <h2 id="supply-cta-title" className="home-heading">{isRtl ? <>أرسل طلبك.<br />وسنرتّب التوريد لك.</> : <>Send your request.<br />We&apos;ll handle the supply.</>}</h2>
              <p className="home-lead">{body}</p>
            </div>
            <Link href={quoteHref} className="home-primary-button">{isRtl ? "اطلب عرض سعر" : "Request a quote"}<DirectionArrow size={18} aria-hidden="true" /></Link>
          </div>
          <div className="supply-cta-footer">
            <Link href={isRtl ? "/ar/track-request" : "/track-request"} className="home-text-link">{isRtl ? "عندك طلب سابق؟ تتبّع طلبك" : "Already sent a request? Track it here"}<DirectionArrow size={16} aria-hidden="true" /></Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
