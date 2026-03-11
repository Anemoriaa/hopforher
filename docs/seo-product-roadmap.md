# ShopForHer Roadmap

Last reviewed: March 11, 2026

This roadmap is anchored to the current generated inventory in `/apps/web/public/page-catalog.json`.

Refresh the live queue with:

```bash
npm run build
npm run seo:ops
```

## Current State

Snapshot after the current March 11, 2026 build:

- 92 total pages
- 81 search-indexable pages
- 11 blocked pages
- 4 guides still need editorial de-overlap work
- 4 guides are still manually search-suppressed
- 7 product pages still fall back to merchant-search URLs

Primary source files:

- `/apps/web/src/content/seo-guides.js`
- `/apps/web/scripts/generate-seo-pages.mjs`
- `/apps/web/public/page-catalog.json`
- `/apps/web/public/guide-catalog.json`
- `/apps/web/public/product-catalog.json`

## Workstream 1: SEO Distinctiveness

Goal: make each guide answer a different buyer moment instead of competing with a nearby page.

Files:

- `/apps/web/src/content/seo-guides.js`
- `/apps/web/scripts/generate-seo-pages.mjs`
- `/apps/web/public/guide-catalog.json`
- `/apps/web/public/page-catalog.json`

Current queue order:

1. `gifts-for-wife`
2. `birthday-gifts-for-girlfriend`
3. `cozy-home-gifts-for-her`
4. `gifts-for-her-who-has-everything`

Rules for each guide pass:

- Change the product mix before changing the prose.
- Keep only one or two shared “safe” anchors with adjacent guides.
- Add at least two lower-reuse products that still match the page promise.
- Update `bestFits`, `pickLanes`, FAQs, and intro copy to match the new lane.
- Only remove a guide from manual suppression after `page-catalog.json` reports it as no longer needing editorial refresh.

Specific improvement targets:

- `gifts-for-wife`: make it less adjacent to `luxury-gifts-for-her` and `daily-use-gifts-for-her`. Push it toward “wife-safe premium utility with emotional confidence.”
- `birthday-gifts-for-girlfriend`: make it more present-ready and less similar to `gifts-for-girlfriend` and `best-gifts-under-100`.
- `cozy-home-gifts-for-her`: make it less interchangeable with `gifts-for-homebodies`. Push it toward room feel and atmosphere, not just home routine.
- `gifts-for-her-who-has-everything`: make it more “novel but still credible” and less like a general looks-expensive page.

## Workstream 2: Merchant-Path Coverage

Goal: convert more product pages from blocked to search-facing.

Files:

- `/packages/catalog/imported-items.js`
- `/packages/catalog/media.js`
- `/apps/web/src/lib/catalog.js`
- `/apps/web/public/product-catalog.json`

Current merchant-path gap queue:

1. `roseseek-crochet-lace-cover-up-pants`
2. `mchic-colorful-beaded-choker`
3. `large-easter-bunny-porch-decor`
4. `oliker-speckled-eggs`
5. `large-ceramic-floor-vase`
6. `ninehaoou-scroll-vase`
7. `artificial-olive-tree-1026`

Execution rules:

- Prefer a direct merchant product URL over affiliate-search fallback.
- Keep the product page live even if it stays noindex for now.
- After each merchant-path fix, rebuild and confirm the product leaves `productsMissingDirectMerchantPath` in `page-catalog.json`.

## Workstream 3: Visual System

Goal: make the site look intentional and branded instead of merely functional.

Files:

- `/packages/brand/tokens.css`
- `/apps/web/src/styles.css`
- `/apps/web/public/discovery.css`

Priority changes:

- Add a stronger type system: display, heading, body, caption, label.
- Define surface tokens for hero panels, rails, cards, compare blocks, and trust blocks.
- Standardize badge colors and semantics.
- Give each CTA type a clear hierarchy: primary buy, secondary open, editorial link, inline jump.
- Tighten spacing so every template uses the same rhythm.
- Improve image framing tokens for product cutouts and editorial crops.

Visual problems to fix first:

- Too many sections share the same white-card-on-light-background treatment.
- Guide pages scan well structurally but do not have enough visual drama.
- Product pages still feel more informational than desirable.
- Hot pages are not visually differentiated enough from static guide pages.
- The homepage still behaves more like a router than a strong editorial front door.

## Workstream 4: Template Redesign

Goal: give each page archetype a distinct visual and informational job.

### Home

Files:

- `/apps/web/src/App.jsx`
- `/apps/web/src/styles.css`
- `/apps/web/index.html`

Changes:

- Replace the current neutral hero with a stronger “choose your buying moment” entry.
- Add 3-5 large lanes: girlfriend, wife, birthday, under $100, trending.
- Show fewer filters up front and more guided entry points.

### Guides

Files:

- `/apps/web/scripts/generate-seo-pages.mjs`
- `/apps/web/public/discovery.css`

Changes:

- Add a visually stronger top-3 compare section.
- Make the sticky rail more valuable: first pick, budget pick, bigger move.
- Increase contrast between overview, shortlist, compare, FAQ, and related sections.

### Product Pages

Files:

- `/apps/web/scripts/generate-seo-pages.mjs`
- `/apps/web/public/discovery.css`

Changes:

- Lead with gallery and “why this is a gift.”
- Add a merchant-confidence block and price-confidence note.
- Improve the alternatives strip so it feels curated rather than generated.

### Hot Pages

Files:

- `/apps/web/scripts/generate-seo-pages.mjs`
- `/apps/web/public/discovery.css`

Changes:

- Push toward a magazine/feed feel.
- Use stronger trend markers, media emphasis, and faster vertical rhythm.
- Make them feel more current and social than guides.

### Date Pages

Files:

- `/apps/web/scripts/generate-seo-pages.mjs`
- `/apps/web/public/discovery.css`
- `/apps/web/src/App.jsx`

Changes:

- Add neighborhood chips and plan-type lanes.
- Make first-date, drinks, dinner, and day-date distinctions more visible.
- Improve local feel with better city-level scaffolding.

## Workstream 5: App Architecture

Goal: reduce the cost of future UI changes.

Files:

- `/apps/web/src/App.jsx`
- `/apps/web/src/lib/*`

Refactor steps:

- Split route shells out of `App.jsx`.
- Move selection/filter logic into dedicated hooks.
- Extract shared UI blocks: compare cards, rail cards, product media, section headers.
- Keep hook-using components top-level only.

## Workstream 6: Performance

Goal: lower friction before adding more interface weight.

Files:

- `/apps/web/src/App.jsx`
- `/apps/web/src/main.jsx`
- `/apps/web/package.json`

Targets:

- Reduce the main web bundle from the current 422 KB built JS asset.
- Move non-critical interactions behind code-splitting where it makes sense.
- Keep discovery pages static-first and lightweight.

## Workstream 7: Ops and Measurement

Goal: make weekly SEO decisions from the generated inventory instead of intuition.

Files:

- `/apps/web/public/page-catalog.json`
- `/apps/web/scripts/seo-ops-report.mjs`
- `/README.md`

Weekly operating loop:

1. Run `npm run build`
2. Run `npm run seo:ops`
3. Clear one guide-overlap issue
4. Clear one merchant-path issue
5. Review whether any suppressed guide can be reopened

Metrics to track outside the repo:

- indexed pages by archetype
- impressions by archetype
- clicks by archetype
- pages with zero impressions after indexing
- merchant CTR from guide pages
- pages blocked by merchant-path gaps

## This Week

Ship order for the next 5 working sessions:

1. Clear `gifts-for-wife`
2. Clear `cozy-home-gifts-for-her`
3. Fix the 7 merchant-path gaps
4. Redesign guide and product templates visually
5. Split more of `/apps/web/src/App.jsx`

## Guardrails

- Do not unsuppress a guide just because the copy sounds better.
- Do not add more guides until the current overlap queue is smaller.
- Do not redesign templates without tightening the shared design tokens first.
- Do not add heavier client-side UI to pages that already work as strong static entry points.
