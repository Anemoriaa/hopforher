# Google Search Console Setup

This repo is already prepared for Google Search Console crawling:

- `https://shopforher.org/robots.txt` allows crawling and points to the sitemap index
- `https://shopforher.org/sitemap.xml` is the primary sitemap index to submit
- the build emits trust pages, guide hubs, product hubs, hot hubs, date hubs, and an HTML site map

## Preferred property type

Use a Domain property if possible.

Google's official docs:

- Property setup and ownership verification: https://support.google.com/webmasters/answer/9008080?hl=en
- Domain properties and DNS verification: https://developers.google.com/search/blog/2019/02/announcing-domain-wide-data-in-search
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

Why Domain property first:

- it covers every protocol and subdomain
- it does not depend on a single page template
- it survives homepage redesigns better than HTML tag verification

## Verification options supported here

### Option 1: Domain property via DNS TXT

Use this when you control DNS for `shopforher.org`.

1. In Search Console, add a new property.
2. Choose `Domain`.
3. Copy the DNS TXT record Google gives you.
4. Add that TXT record where DNS is hosted.
5. Click `Verify` in Search Console.

No code change is required for this option.

### Option 2: URL-prefix property via meta tag

Use this if you want Google to verify `https://shopforher.org/` through the homepage HTML.

Set this environment variable in Cloudflare Pages:

- `GOOGLE_SITE_VERIFICATION_META=<token from Google>`

What the build does:

- injects `<meta name="google-site-verification" ...>` into `apps/web/dist/index.html`

### Option 3: URL-prefix property via HTML file

Use this if Google gives you a verification file such as `google1234567890abcdef.html`.

Set this environment variable in Cloudflare Pages:

- `GOOGLE_SITE_VERIFICATION_FILE=google1234567890abcdef.html`

Optional override:

- `GOOGLE_SITE_VERIFICATION_FILE_CONTENT=google-site-verification: google1234567890abcdef.html`

If you leave `GOOGLE_SITE_VERIFICATION_FILE_CONTENT` empty, the build writes the default body Google expects:

- `google-site-verification: <filename>`

## Build and deploy flow

1. Add the chosen verification env var in Cloudflare Pages.
2. Deploy the site.
3. Confirm the verification target is live:
   - Meta tag method: open the deployed homepage source and confirm the `google-site-verification` meta tag is present.
   - HTML file method: open `https://shopforher.org/<your-verification-file>.html`.
4. Click `Verify` in Search Console.
5. Submit `https://shopforher.org/sitemap.xml` in the `Sitemaps` report.

## First URLs to inspect

After verification, inspect these first:

- `https://shopforher.org/`
- `https://shopforher.org/guides/`
- `https://shopforher.org/gift/`
- `https://shopforher.org/gifts-for-wife/`
- `https://shopforher.org/gifts-for-girlfriend/`
- `https://shopforher.org/best-gifts-under-100/`

## What is already handled in the repo

- XML sitemap index at `/sitemap.xml`
- segmented child sitemaps for pages, guides, hot stories, date cities, and products
- `robots.txt` sitemap reference
- canonical URLs on landing pages
- HTML site map
- trust pages for methodology and contact
- `noindex` handling for utility assets and suppressed pages

## What Search Console will still need from you

- ownership verification in Google
- DNS access if you want a Domain property
- ongoing review of `Pages`, `Performance`, and `Sitemaps`
- page/query decisions based on real impression and CTR data
