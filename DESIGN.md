---
name: Build Saudi
description: Arabic-first building materials and finishes supply for Saudi projects.
colors:
  ink: "rgb(0 57 50)"
  accent: "rgb(197 217 45)"
  paper: "rgb(244 243 235)"
  white: "#fff"
  muted: "#536760"
  soft: "#edf2ec"
  line: "#d3ddd6"
  accent-hover: "#d2e34f"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.8rem, 4.7vw, 4.6rem)"
    fontWeight: 600
    lineHeight: 1.17
    letterSpacing: "-.035em"
  display-arabic:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.8rem, 4.7vw, 4.6rem)"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(2rem, 3.3vw, 3.2rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.025em"
  body:
    fontSize: "1rem"
  lead:
    fontSize: "1.125rem"
    lineHeight: 1.9
  button:
    fontSize: ".9375rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  control: "12px"
  surface: "16px"
  phone: "42px"
spacing:
  unit: ".25rem"
  section: "clamp(4rem, 7vw, 7rem)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    typography: "{typography.button}"
    padding: ".8rem 1.35rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: ".8rem 1.35rem"
  demo-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.5rem"
---

# Design System: Build Saudi

## Overview

Build is a Saudi supplier of building materials and finishes. Preserve its established logo and palette. The implementation uses a light, spacious page with original bilingual copy and concrete HTML/CSS product demonstrations. Hatif informs the storytelling sequence only; it does not supply a new brand identity or visual metaphor.

This is a code-derived specification. Frontmatter tokens are normative; prose explains their application. Primary sources are [shared CSS](app/globals.css), [Tailwind configuration](tailwind.config.ts), [font loading](lib/fonts.ts), [marketing sections](components/marketing/sections.tsx), [demonstrations](components/marketing/mockups.tsx), and [navigation behavior](components/marketing/mega-menu.tsx). Product constraints come from [PRODUCT.md](PRODUCT.md), [DECISIONS.md](DECISIONS.md), and the [brand audit](docs/brand-audit.md). The later shared-token block in CSS takes precedence over earlier legacy declarations.

Key characteristics: deep-green text, lime actions, warm light surfaces, IBM Plex Arabic/Latin, direction-aware spacing, and visibly labelled illustrative content.

## Colors

Ink anchors text, device outlines, the closing CTA, and footer. Accent highlights primary actions and selected demo states; always pair it with ink text. Paper provides the hero, comparison and alternating feature backgrounds. White holds content and navigation. Soft adds quiet separation to process, trust and sample sections. Muted carries secondary copy; line separates rows and outlines cards.

The frontmatter preserves the CSS RGB notation, resolving the three `--brand-*-rgb` channel values into portable color strings. Tailwind `brand.dark` and `brand.primary` both reference the same deep green. Use existing tokens rather than introducing another action green. The original Arabic and English assets in `public/brand` remain the logo source; supplied manufacturer logos do not establish client or certification claims.

## Typography

`lib/fonts.ts` loads IBM Plex Sans Arabic and IBM Plex Sans with `display: swap`: Arabic uses weights 400 and 600; Latin supports 400, 500, 600 and 700. Font faces load on demand for the active language, avoiding unused cross-locale preload traffic. English uses `--font-latin`; Arabic uses `--font-arabic`, then Latin and sans-serif fallbacks. Existing local font assets and the `gtAmericaArabic` export contract remain intact.

Use the display role for the marketing hero and headline for section titles. Arabic headings have zero letter spacing; Arabic hero line height is 1.4. English hero measure is 10ch, Arabic 12ch; mobile uses 13ch. Lead copy has a 36rem maximum in the hero, with 1.9 line height. Main headings balance text wrapping. Buttons are 600 weight. Demo labels are intentionally compact illustrative UI, not substitutes for readable page instructions. Earlier `.type-*` utility rules remain for other routes; do not confuse their sizes or heavier weights with marketing heading tokens.

## Layout

The marketing container is `min(100% - 3rem, 1200px)` with automatic inline margins. Section padding uses the frontmatter section token. The fixed shared header is 72px tall; anchor scroll padding is 6rem. Use `margin-inline`, `padding-inline`, `padding-block`, `inset-inline` and `text-align: start` for Arabic/English parity. Directional arrows mirror in RTL; amounts and step numbers use explicit LTR islands where needed.

The light hero splits copy and the material-list phone demonstration into 1.15fr/1fr columns with a 5rem gap. The page sequence is hero, supplied manufacturer brands and qualitative benefits, three numbered step demonstrations, eight categories, four feature demonstrations, comparison, trust/warranty, visibly sample testimonials, FAQ and closing CTA. Category cards reveal homepage anchor details and lead into the existing quote flow; there is no invented catalog route.

Process uses three columns; categories use four; features, samples and FAQ use two. Feature copy and demonstrations alternate on desktop. At max-width 1100px, categories become two columns and gaps tighten. At max-width 767px, the container becomes `min(100% - 2rem, 600px)`, the hero and other paired/three-column layouts stack, and feature order returns to normal document order. Categories stay in two columns. The phone changes from 310px to 300px with `max-width: 100%`. Compact mobile comparison cells retain semantic table structure.

## Elevation & Depth

Use tonal separation and borders for most surfaces. The shared raised shadow is `0 18px 44px rgb(var(--brand-dark-rgb) / .10)`, used by feature demonstrations and the mega menu. Process demonstrations deliberately have no shadow. The phone is a device exception with `0 24px 50px rgb(var(--brand-dark-rgb) / .16)`. Do not spread device-level elevation across ordinary cards.

Motion uses existing Framer Motion for a 180ms mega-menu entrance with features deferred until opening; reduced-motion users get zero translation/duration. Other motion uses restrained CSS: 180ms button/category transitions, a 360ms ease-out phone entrance, and a progressive 350ms ease-out scroll reveal only where view timelines are supported. Content remains visible without that support. Reduced-motion rules remove phone/reveal and brand-track animation, collapse other transitions and disable smooth scrolling. Preserve the brand marquee pause behavior.

## Shapes

Controls use 12px corners and surfaces 16px. The 42px phone shell with a 7px ink border, circular trust emblem, avatar and timeline markers are purpose-specific exceptions. Category cards use thin line borders. The upload demonstration uses a dashed boundary. Do not apply device or badge silhouettes to all interface elements.

## Components

**Buttons.** Primary quote actions use lime with deep-green text, at least 48px height, and the frontmatter padding. Hover lightens lime and lifts 2px. Outline actions use a transparent background, line-colored border and soft hover fill. Shared navigation controls and text links have at least 44px height. Use genuine links for destinations.

**Navigation.** Preserve logo artwork, language switch, quote action and existing destinations. The mega menu uses `aria-expanded`/`aria-controls`, closes on Escape, returns focus to its trigger, and closes on outside pointer interaction or focus leaving. Mobile displays the labelled menu toggle. Keep the keyboard-visible skip link. Marketing/navigation links disable speculative prefetch as recorded in DECISIONS.md.

**Demonstrations and cards.** The phone tells the material-list, quote and delivery conversation in HTML/CSS. `UiMockup` covers upload, quote, delivery, warranty and supplier-network states. Every demonstration includes its example label; quote amounts, tax notes and ETAs are illustrations, not promises. The three numbered steps and four alternating feature demos reuse this vocabulary. Sample testimonial notices must remain visible; never recast these as verified customer endorsements.

**Comparison and trust.** Preserve table caption, scoped column/row headers and the qualitative comparison note. The Build comparison column uses a deep-green heading and white cells. The trust section links to the existing warranty terms; the seal does not imply an external certification.

**FAQ.** Native `details`/`summary` preserves keyboard behavior; the plus rotates 45 degrees when open. Keep question and answer text in the locale dictionary.

**Forms.** Existing non-marketing inputs, selects and textareas share 12px corners, a 44px minimum height, green-neutral borders, a 2px ink focus outline with 3px offset, and a red invalid border for `aria-invalid="true"`. The general interactive focus treatment is 3px ink with 4px offset; dark CTA/footer surfaces use lime focus outlines. Preserve labels, validation, request payloads, API routes and submission behavior.

## Do's and Don'ts

- Do preserve the original palette, logos, routes, analytics identifiers, SEO and backend contracts.
- Do maintain complete Arabic and English content, semantic headings, keyboard controls, visible focus and reduced-motion support. WCAG AA is the target; documentation alone does not certify compliance.
- Do use the existing quote, tracking, warranty and registration flows from the feature links.
- Do preserve demonstration and sample labels in both languages.
- Don't use white text on lime primary actions.
- Don't invent statistics, testimonials, delivery SLAs, certifications or manufacturer relationships.
- Don't replace Build's identity with Hatif's brand or invent a north-star metaphor.
- Don't use physical left/right positioning where logical properties express the same layout.
