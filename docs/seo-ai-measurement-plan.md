# Measurement Plan: Analytics & AI-Referral Tracking

## Current state (confirmed)

- Google Tag Manager (`GTM-KBN6BHR`) is installed site-wide via `components/analytics/gtm.tsx` (script + noscript), loaded in both locale root layouts.
- **No `dataLayer.push()` or `gtag()` calls exist anywhere in `app/`, `components/`, or `lib/`** — confirmed by repo-wide grep. Whatever GA4/tags are configured live entirely inside the GTM container UI (not visible from this repo), and no custom events are being fed to it from the application code.
- Whether a GA4 configuration tag actually exists inside the GTM container, and whether it's capturing `utm_source=chatgpt.com` referrals today, cannot be verified from the codebase — this requires GTM/GA4 admin access, not available in this audit.

## Recommended events (not implemented — Category B, see approval doc)

| Event | Trigger point (approximate, needs confirmation against actual form components) | Notes |
|---|---|---|
| `request_quote_started` | `/get-quote` form first-interaction | |
| `request_quote_submitted` | Successful submission of `app/api/quotes/register` (or equivalent client call) | Must not include email/phone/name as event parameters — pass only non-identifying metadata (e.g. category count, has-BOQ boolean) |
| `boq_uploaded` / `material_list_uploaded` | File-upload success on the quote form | |
| `supplier_registration_started` / `submitted` | `/register` flow | Same PII exclusion rule |
| `contact_clicked` / `phone_clicked` / `email_clicked` / `whatsapp_clicked` | Header/footer contact CTAs, where present | |

## Why this is Category B, not implemented directly

1. **Privacy:** the brief explicitly requires not sending personal form values to analytics — this needs a careful pass over each form's submit handler to confirm exactly what gets passed, which is form-logic-adjacent work best done deliberately, not as a drive-by SEO change.
2. **Taxonomy ownership:** event names/parameters should be agreed once, not iterated after they're already flowing into GA4 reports (renaming events later fragments historical data).

## Referral-traffic reporting

No new GA4 "exploration"/custom report was created in this pass (would need GA4 admin access this audit doesn't have). Recommended report once GA4 access is available: a session-level exploration filtered on `Session source/medium` containing `chatgpt.com`, `perplexity.ai`, `bing.com/chat`, segmented against the conversion events above once they exist.

## Status

| Item | Status |
|---|---|
| GTM container installed | Confirmed existing, no change needed |
| GA4 tag inside GTM actually configured | Unknown — needs GTM/GA4 admin access |
| Custom conversion events in code | Missing — Category B, not implemented |
| AI-referral segment/report | Not created — depends on GA4 access, not available here |
