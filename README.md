# hopforher

## Dates / Nearby Places

The Dates tab now loads nearby spots through a Cloudflare Pages Function at `functions/api/date-spots.js`.

### Server-side env

Copy `.dev.vars.example` to `.dev.vars`.

For the immediate path, use Google Places:

- `DATE_SPOTS_PROVIDER=google-places`
- `GOOGLE_PLACES_API_KEY`
- optional tuning: `GOOGLE_PLACES_SEARCH_RADIUS_METERS`, `GOOGLE_PLACES_RANK_PREFERENCE`
- optional override: `GOOGLE_PLACES_FIELD_MASK`

The default Google field mask is set up to support richer Dates cards:

- ratings and review count
- price level
- open-now / next-open / next-close status
- venue website when Google returns one

The function auto-prefers Google Places when `GOOGLE_PLACES_API_KEY` is present. If you later get partner access, you can switch to OpenTable with:

- `DATE_SPOTS_PROVIDER=opentable`
- `OPENTABLE_DIRECTORY_API_URL`
- `OPENTABLE_API_KEY` or `OPENTABLE_BEARER_TOKEN`
- optional param/header overrides if your partner endpoint uses different names

Without provider credentials, the Dates tab falls back to generic nearby date lanes instead of fake live inventory.

### Client-side env

Local `npm run dev` now serves `/api/date-spots` directly through Vite dev middleware, using values from `.dev.vars`.

Copy `apps/web/.env.example` to `apps/web/.env.local` only if the client should call a different API origin in dev:

- `VITE_DATE_SPOTS_API_PATH=/api/date-spots`

The UI stays provider-agnostic: it ranks nearby spots from the server response, then opens Google Maps, the venue site, or OpenTable depending on which provider is active.

## SEO / AI Discovery

The site ships static guide, hot, date, product, and trust pages so crawlers and AI assistants can parse the content without running the app.

### Trust pages

These pages are generated or served as first-party trust surfaces:

- `/about.html`
- `/editorial-policy.html`
- `/contact.html`

They are linked from the main site navigation and the HTML site map.

### Crawl surfaces

The build also emits extra discovery surfaces:

- `/site-map.html` for a readable HTML directory of the main pages
- `/feed.xml` for a simple RSS feed of trust, guide, hot, and date pages
- `/product-catalog.json` for a machine-readable product catalog with price bands, merchant paths, and product-page URLs

These utility files stay available for feeds and agents, but they are not included in the XML sitemap as primary search landing pages.

### Google Search Console

The site already ships the main Search Console crawl surfaces:

- `robots.txt` with a sitemap reference
- `sitemap.xml` as the primary sitemap index
- crawlable trust pages, guides, product hubs, hot hubs, and an HTML site map

Preferred ownership method:

- add a Domain property in Google Search Console and verify it with Google's DNS TXT record

URL-prefix verification is also supported by the build:

- `GOOGLE_SITE_VERIFICATION_META` injects the homepage verification meta tag into `apps/web/dist/index.html`
- `GOOGLE_SITE_VERIFICATION_FILE` writes the verification HTML file into `apps/web/dist/`
- `GOOGLE_SITE_VERIFICATION_FILE_CONTENT` is optional if you need to override the default file body

After verification, submit `https://shopforher.org/sitemap.xml` in Search Console.

See [docs/google-search-console.md](/mnt/c/Projects/giftsher/docs/google-search-console.md) for the exact setup flow.

### Referral attribution

`/ai-attribution.js` captures first-visit campaign and AI-referral sources such as `utm_source=chatgpt.com` or known AI referrers, then posts a lightweight event to `/api/attribution`.

The Pages Function logs those events so traffic sources can be reviewed in Cloudflare logs without exposing analytics keys in the client.

Each event now includes:

- `pageType` such as `guide`, `product`, `hot-story`, `date-city`, or `trust`
- `pageSlug` for the specific page when available

### Affiliate click logging

`/affiliate-clicks.js` captures outbound paid-link clicks on Amazon CTAs, then posts a lightweight event to `/api/affiliate-click`.

Those logs include:

- `pageType` and `pageSlug`
- link placement such as product-page, guide-list, or preview CTA
- product id, slug, and ASIN when available
- current source / campaign context from the first-session attribution capture

### IndexNow

If `INDEXNOW_KEY` is set in Cloudflare Pages env:

- `/indexnow.txt` will serve the key from the Pages Function
- `npm run build -w @giftsher/web` will auto-submit URLs from `public/sitemap.xml` after the build completes
- `npm run indexnow -w @giftsher/web` still works as a manual retry path

The submit script uses `INDEXNOW_KEY` and posts the current sitemap URLs to the IndexNow endpoint.

Optional env:

- `INDEXNOW_AUTOSUBMIT=0` disables the automatic post-build submit
- `INDEXNOW_STRICT=1` fails the build if the submit step fails
