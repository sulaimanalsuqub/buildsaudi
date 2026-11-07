# Redesign decisions
- Work in `/Users/sulaiman/buildsaudi`, the clean main checkout of the marketing repository, on `redesign/hatif-style`. The separate storefront worktree is outside scope.
- Keep existing `/ar` Arabic and `/` English routing, including locale-preserving page switches and Arabic x-default hreflang. Do not create duplicate /en URLs or change middleware/backend behavior.
- Keep the existing deep green #003932, lime #C5D92D and warm neutral #F4F3EB. Lime CTAs use dark text, never white. Secondary copy uses a sufficiently dark green-neutral.
- Use IBM Plex Sans Arabic with IBM Plex Sans Latin through next/font for the requested Arabic/Latin pairing; preserve original logo artwork and existing font files.
- Code-first implementation of the explicitly requested phone and UI demonstrations. All illustrative quotes, ETAs and testimonials are visibly marked as examples, not operational promises.
- There is no existing product catalog route: category cards link to category detail anchors in the homepage catalog, which offer the existing quote flow. No invented store URLs.
- CSS handles motion without adding animation dependencies. Keep existing dependencies for other pages.
- The connected browser runtime reported no available browsers. Use the installed Playwright CLI for public-site research and local visual verification.
- All API, env, analytics IDs and existing form behavior remain outside the change boundary.
