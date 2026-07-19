# AI Search Optimization / GEO Audit

## Crawler access

- **robots.txt** (live, confirmed): only a single `User-agent: *` block (`Allow: /`, with `Disallow` on `/admin/`, `/api/`, `/offer/`, the two `register/complete` paths, and `/maintenance`). **No bot-specific rules exist for OAI-SearchBot or GPTBot.**
- Because there is no explicit `Disallow` targeting either bot, **both OAI-SearchBot and GPTBot are currently allowed by the wildcard rule** — i.e., neither is blocked today. This is a confirmed fact, not a guess.
- No CDN/WAF/bot-challenge layer was found blocking crawlers: the site runs on plain Vercel (no Cloudflare proxy in front — `challenges.cloudflare.com` only appears in the CSP for the Turnstile widget used on forms, not as a page-level bot gate). No CAPTCHA or JS challenge was observed on any public page.
- Public pages return real server-rendered HTML with title/description/H1/nav/CTAs present without JavaScript execution (confirmed via raw `curl`, no headless browser needed) — good for any crawler that doesn't execute JS.

## Recommendation on OAI-SearchBot (Category A once verified against current OpenAI documentation)

Add an explicit block to `app/robots.ts`:

```
{ userAgent: "OAI-SearchBot", allow: "/" }
```

This doesn't change actual access (already allowed via wildcard) but makes the intent explicit and future-proofs against the wildcard rule changing later. **Not yet implemented in this pass** — holding it alongside the GPTBot decision below so both crawler-policy changes to `robots.ts` land together, since editing the same file twice for two decisions made at different times is more error-prone than one deliberate edit.

## GPTBot policy — owner decision required

GPTBot (OpenAI's training-data crawler) is a **separate bot from OAI-SearchBot** (OpenAI's search/answer-retrieval crawler). Today, both are allowed identically via the wildcard. That may not be what the owner wants:

- Allowing **OAI-SearchBot** is about discoverability/citation in ChatGPT's search feature — generally low-risk, analogous to allowing Googlebot.
- Allowing **GPTBot** means site content can be used for OpenAI model training — a different tradeoff (no direct traffic/citation benefit, but content contributes to training data) that some publishers explicitly opt out of.

**This audit does not change the current GPTBot setting.** The owner needs to decide between:
1. Leave as-is (wildcard covers both, no explicit rule).
2. Explicitly `Allow: /` for GPTBot (same as OAI-SearchBot — makes the current allowance explicit).
3. Explicitly `Disallow: /` for GPTBot only, while keeping OAI-SearchBot allowed (opt out of training use, keep search/citation access).

No option here is "correct" by default — it's a business/content-policy call, not a technical one. Recommend option 3 as the more common approach among B2B sites (get citation benefit, opt out of training) but this is not implemented pending explicit sign-off.

## Entity understanding (see entity-consistency-audit.md for full detail)

Build's own site currently describes itself consistently as a direct materials **supplier**, while the brief's official positioning is a sourcing/**procurement** company. An AI system reading the site today would summarize Build as a supplier, not as a procurement intermediary — which may or may not match how the owner wants to be surfaced in AI answers. Flagged as Category B (business approval), not implemented.

## Direct-answer / citation readiness

Checked against the brief's target questions ("What is Build?", "Does Build source locally/internationally?", "How can a customer submit an RFQ?", etc.):

| Question | Answerable from current site? |
|---|---|
| What is Build / what does it supply? | Partially — homepage lists the 8 categories and a one-line description, but framed as "supplier" (see entity conflict above), and there is no dedicated "About"/"How it works" page to cite. |
| Can a customer submit an RFQ / upload a BOQ? | Yes — `/get-quote` exists and is indexable, with its own metadata. |
| How are suppliers selected / how are quotations compared? | Not covered anywhere in visible copy — no process explanation page exists. |
| Can a supplier register? | Yes — `/register` exists and is indexable. |
| Does Build source internationally? | Not stated anywhere in visible copy currently (site copy only says delivery "across the Kingdom" — no mention of international sourcing at all, which directly contradicts the brief's "Sourcing the World" tagline and international-sourcing positioning). |

**Missing high-value factual pages** (per brief Phase 14, none created in this pass — Category B): About/How Build Works, a real process explanation (RFQ → sourcing → comparison → logistics → delivery), and category-level pages for the 8 official catalog categories (none exist today — homepage only shows them as static cards, not linkable/citable pages).

## Structured data

See `seo-technical-audit.md` #8 — `HomeAndConstructionBusiness` type without address/geo. `Organization` and `WebSite` schema are otherwise valid JSON (verified by parsing the live `<script type="application/ld+json">` payloads), consistently emitted on every page via the root layouts.

## Analytics support for AI-referral traffic

GTM (`GTM-KBN6BHR`) is installed site-wide, which is sufficient to see standard `utm_source=chatgpt.com` / referrer-based sessions in GA4 without additional code changes, **provided a GA4 tag is actually configured inside the GTM container** — that configuration lives in the GTM UI, not in this repo, and could not be verified from the codebase. No custom conversion events exist in code today (see `seo-ai-measurement-plan.md`).

## Summary of what's implemented vs. pending

| Item | Status |
|---|---|
| OAI-SearchBot confirmed not blocked | Confirmed (informational) |
| Explicit OAI-SearchBot `Allow` rule in robots.txt | Not implemented — pending, low-risk, bundling with GPTBot decision |
| GPTBot policy | Owner decision required — not implemented |
| Entity/positioning consistency (supplier vs. procurement) | Owner decision required — not implemented |
| Missing About/process/category pages | Owner decision required — not implemented |
| `HomeAndConstructionBusiness` schema fields | Owner decision required — not implemented |
| Server-rendered, JS-independent HTML for all public pages | Confirmed good, no action needed |
| Static rendering / fast, cacheable responses | **Fixed this pass** (see `seo-fix-log.md`) |
