# Build identity audit
Sources: https://build.sa/, repository at baseline 4afc8c8, inspected 2026-11-07.

The live brand positions Build as a Saudi building-materials and finishes supplier. Existing site centers quote requests, WhatsApp and site delivery. This is a supplier, not a marketplace or a new SaaS product.

| Token | Existing evidence | Decision |
|---|---|---|
| Deep green | tailwind brand.dark/primary #003932 | Preserve |
| Lime | tailwind brand.accent #C5D92D | Preserve; dark text for contrast |
| Warm neutral | tailwind brand.light #F4F3EB | Preserve |
| Secondary green | existing homepage #087d39 | Consolidate actions around lime/deep green |
| Type | local GT America Arabic, weights 300–900 | Retain assets; use requested IBM Arabic/Latin pairing via next/font |
| Radius | premium 16px; cards 12–16px; pill controls | 16px surfaces, 12px controls; phone shell is a device exception |
| Shadows | subtle offset green-tinted document shadow | One restrained elevation token |

Logo assets: public/brand/logo-ar.svg/png, logo-en.svg/png, icon-mark.svg. No redesign. Supplier assets: public/images/brands/{grohe,neproplast,duegi,american-standard,grundfos,hansgrohe,roca,raktherm}.webp. Reuse without asserting client or certification relationships.

Existing app uses separate English (site) and Arabic root layouts with proper html lang/dir, pageMetadata canonical/hreflang and opengraph-image. Footer includes warranty, about, registration, legal policies, support email/phone and five social links. Preserve them.
