# Authority & Third-Party Citation Plan

No external profile audit (LinkedIn, Google Business Profile, industry directories) was performed in this pass — that requires access to accounts this audit doesn't have (social/business-listing logins), and this audit's tools are limited to the repository and public unauthenticated crawling.

## What was checked from the public site itself

- `OrganizationSchema.sameAs` currently lists exactly one profile: `https://twitter.com/buildsaudi` (`components/seo/schema-org.tsx`). This was not independently verified as a real, currently-active account (would require visiting the URL, which risks confirming or denying account status without authorization to speak to that) — flagged for the owner to confirm it's accurate before relying on it in structured data.
- No other `sameAs` entries (LinkedIn, Google Business Profile, etc.) are present in the schema, meaning even accurate profiles elsewhere aren't currently linked from structured data.

## Recommended next steps (all Category B / requires owner access — none actioned here)

| Opportunity | Classification |
|---|---|
| Confirm `@buildsaudi` Twitter/X account is real, active, and owned by Build; add/correct in `sameAs` | Existing profile needs correction/confirmation |
| Add a LinkedIn company page URL to `sameAs`, if one exists | Missing high-value profile (if applicable) |
| Add Google Business Profile, if Build has a public office appropriate to list (ties into the `HomeAndConstructionBusiness` schema decision in `entity-consistency-audit.md`) | Missing high-value profile / owner decision |
| Relevant Saudi construction/procurement industry directories (not identified by name in this pass — would need owner input on which are legitimate and already-relevant to the business) | Requires owner input before any specific directory is recommended by name |

## Explicitly rejected approaches (per the brief, reaffirmed here)

Buying backlinks, mass automated directory submissions, fake partner/press pages, or fabricated `sameAs` entries are not recommended under any circumstance and were not considered as options.

## Status

This document is a scoping placeholder, not a completed audit — it identifies what would need to happen and why, but doing so requires account-level access (social profiles, business listings) outside this audit's reach. Recommend the owner (or whoever holds those accounts) provide current profile URLs so a real consistency check can be done in a follow-up pass.
