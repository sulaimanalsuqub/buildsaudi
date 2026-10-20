"use client";

import { useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { Grid } from "@/components/ui/grid";

const brands = [
  { name: "GROHE", file: "grohe" },
  { name: "NEPROPLAST", file: "neproplast" },
  { name: "DueGi Rubinetterie", file: "duegi" },
  { name: "American Standard", file: "american-standard" },
  { name: "Grundfos", file: "grundfos" },
  { name: "Hansgrohe", file: "hansgrohe" },
  { name: "Roca", file: "roca" },
  { name: "RAKtherm", file: "raktherm" },
];

export function BrandMarquee({ isRtl = false }: { isRtl?: boolean }) {
  const [paused, setPaused] = useState(false);

  return (
    <section className="brand-section bg-white text-brand-dark" aria-labelledby="brands-title">
      <Grid>
        <div className="col-span-4 flex items-end justify-between gap-6 sm:col-span-8 lg:col-span-12">
          <div>
            <h2 id="brands-title" className="type-editorial">
              {isRtl ? "علامات تجارية نوفّرها لك" : "Brands we source for you"}
            </h2>
            <p className="type-body mt-3 text-brand-dark/70">
              {isRtl ? "احتياجات مشروعك، من العلامات اللي تثق فيها." : "Your project essentials, from brands you trust."}
            </p>
          </div>
          <button
            type="button"
            className="brand-motion-toggle flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-dark/20 transition-colors hover:bg-brand-dark/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
            onClick={() => setPaused(!paused)}
            aria-label={isRtl ? (paused ? "تشغيل حركة الشعارات" : "إيقاف حركة الشعارات") : (paused ? "Play logo animation" : "Pause logo animation")}
            aria-pressed={paused}
          >
            {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
        </div>
      </Grid>
      <div className="brand-marquee" data-paused={paused} dir="ltr">
        <div className="brand-track">
          {[0, 1, 2].map((copy) => (
            <ul className="brand-group" key={copy} aria-hidden={copy > 0 ? true : undefined}>
              {brands.map((brand) => (
                <li className="brand-logo" key={brand.file}>
                  <Image src={`/images/brands/${brand.file}.webp`} alt={copy === 0 ? brand.name : ""} width={210} height={80} sizes="(max-width: 639px) 120px, 170px" className="h-full w-full object-contain" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
