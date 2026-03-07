import fs from "node:fs";
import path from "node:path";
import { seoCatalog, seoDateCities, seoGuides, seoHotStories, seoSite } from "../src/content/seo-guides.js";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const siteUrl = seoSite.url;
const updatedAt = seoSite.updatedAt;
const formattedDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(updatedAt));
const catalogById = new Map(seoCatalog.map((gift) => [gift.id, gift]));
const guideBySlug = new Map(seoGuides.map((guide) => [guide.slug, guide]));
const giftBySlug = new Map(seoCatalog.map((gift) => [gift.slug, gift]));

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function affiliateUrl(query) {
  const url = new URL(seoSite.affiliateBaseUrl);
  url.searchParams.set("k", query);
  url.searchParams.set("tag", seoSite.affiliateTag);
  return url.toString();
}

function guideItems(guide) {
  return guide.itemIds.map((id) => catalogById.get(id)).filter(Boolean);
}

function productUrl(gift) {
  return `${siteUrl}/gift/${gift.slug}/`;
}

function hotThumbUrl(story) {
  return `https://picsum.photos/seed/shopforher-${story.slug}/1200/1600`;
}

function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderGuidePage(guide) {
  const items = guideItems(guide);
  const related = guide.related.map((slug) => guideBySlug.get(slug)).filter(Boolean);
  const canonical = `${siteUrl}/${guide.slug}/`;
  const pageTitle = guide.title;
  const faqs = [
    {
      q: `What is the safest pick on this ${guide.label.toLowerCase()} page?`,
      a: items[0]
        ? `${items[0].name} is the cleanest first answer because ${items[0].why.charAt(0).toLowerCase()}${items[0].why.slice(1)}`
        : "Start with the first ranked pick.",
    },
    {
      q: "How should I choose between a premium pick and a practical pick?",
      a: "Use premium when the moment matters more. Use practical when daily use will make the gift feel stronger after the first day.",
    },
  ];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: guide.h1,
    url: canonical,
    numberOfItems: items.length,
    itemListElement: items.map((gift, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: gift.name,
      description: gift.why,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${siteUrl}/guides/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.h1,
        item: canonical,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: guide.h1,
    description: guide.description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
    about: {
      "@type": "Thing",
      name: guide.label,
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(guide.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(guide.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/logo1.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(guide.description)}">
  <meta name="twitter:image" content="${siteUrl}/logo1.png">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
  ${jsonLdScript(faqSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">${escapeHtml(guide.groupLabel)}</p>
        <h1>${escapeHtml(guide.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(guide.intro)}</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(formattedDate)}</span>
          <span>${items.length} picks</span>
          <span>Fast merchant checkout</span>
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Top picks</p>
          <h2>Best matches right now</h2>
        </div>
        <ol class="discovery-list">
          ${items
            .map(
              (gift, index) => `<li class="discovery-item">
            <div class="discovery-item-head">
              <span class="discovery-rank">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
                <p class="discovery-price">${escapeHtml(gift.priceLabel)}</p>
              </div>
            </div>
            <p class="discovery-copy">${escapeHtml(gift.hook)} ${escapeHtml(gift.why)}</p>
            <p class="discovery-best-for">Best for: ${escapeHtml(gift.bestFor)}</p>
            <div class="discovery-actions">
              <a class="discovery-text-link" href="/gift/${gift.slug}/">View product</a>
              <a class="discovery-btn" href="${affiliateUrl(gift.query)}" target="_blank" rel="noreferrer">Buy on Amazon</a>
            </div>
          </li>`
            )
            .join("")}
        </ol>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">FAQ</p>
          <h2>Quick answers</h2>
        </div>
        <div class="discovery-faqs">
          ${faqs
            .map(
              (faq) => `<article class="discovery-faq">
            <h3>${escapeHtml(faq.q)}</h3>
            <p>${escapeHtml(faq.a)}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Related</p>
          <h2>More guides</h2>
        </div>
        <div class="discovery-related">
          ${related
            .map(
              (entry) => `<a class="discovery-related-link" href="/${entry.slug}/">
            <span>${escapeHtml(entry.groupLabel)}</span>
            <strong>${escapeHtml(entry.label)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <p>Affiliate links. We may earn from qualifying purchases.</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
        <a href="/llms.txt">llms.txt</a>
      </div>
      <a href="mailto:hello@shopforher.org">hello@shopforher.org</a>
    </footer>
  </div>
</body>
</html>`;
}

function renderProductPage(gift) {
  const matchingGuides = seoGuides.filter((guide) => guide.itemIds.includes(gift.id)).slice(0, 6);
  const relatedProducts = seoCatalog.filter((entry) => entry.id !== gift.id).slice(0, 6);
  const canonical = productUrl(gift);
  const pageTitle = `${gift.name} | ShopForHer`;
  const description = `${gift.name} is a ${gift.badge} pick on ShopForHer. ${gift.why}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: gift.name,
    description,
    category: "Gift for her",
    sku: gift.id,
    image: [`${siteUrl}/logo1.png`],
    brand: {
      "@type": "Brand",
      name: "ShopForHer Picks",
    },
    offers: {
      "@type": "Offer",
      url: affiliateUrl(gift.query),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Amazon",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Gift",
        item: `${siteUrl}/gift/${gift.slug}/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: gift.name,
        item: canonical,
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/logo1.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${siteUrl}/logo1.png">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(productSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Product</p>
        <h1>${escapeHtml(gift.name)}</h1>
        <p class="discovery-intro">${escapeHtml(gift.hook)} ${escapeHtml(gift.why)}</p>
        <div class="discovery-meta">
          <span>${escapeHtml(gift.priceLabel)}</span>
          <span>${escapeHtml(gift.badge)}</span>
          <span>Updated ${escapeHtml(formattedDate)}</span>
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Why it works</p>
          <h2>Quick read</h2>
        </div>
        <div class="discovery-faqs">
          <article class="discovery-faq">
            <h3>Best for</h3>
            <p>${escapeHtml(gift.bestFor)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Why this is here</h3>
            <p>${escapeHtml(gift.why)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Fast path</h3>
            <p>View the product here, then finish checkout on the merchant site with the fastest payment option they support.</p>
          </article>
        </div>
        <div class="discovery-actions">
          <a class="discovery-btn" href="${affiliateUrl(gift.query)}" target="_blank" rel="noreferrer">Buy on Amazon</a>
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Featured in</p>
          <h2>Guides using this pick</h2>
        </div>
        <div class="discovery-related">
          ${matchingGuides
            .map(
              (guide) => `<a class="discovery-related-link" href="/${guide.slug}/">
            <span>${escapeHtml(guide.groupLabel)}</span>
            <strong>${escapeHtml(guide.label)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Related picks</p>
          <h2>More products</h2>
        </div>
        <div class="discovery-related">
          ${relatedProducts
            .map(
              (entry) => `<a class="discovery-related-link" href="/gift/${entry.slug}/">
            <span>${escapeHtml(entry.badge)}</span>
            <strong>${escapeHtml(entry.name)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <p>Affiliate links. We may earn from qualifying purchases.</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
        <a href="/llms.txt">llms.txt</a>
      </div>
      <a href="mailto:hello@shopforher.org">hello@shopforher.org</a>
    </footer>
  </div>
</body>
</html>`;
}

function renderGuideIndex() {
  const groups = [
    ["relationship", "Relationship guides"],
    ["moments", "Moment guides"],
    ["budget", "Budget guides"],
    ["angle", "Angle guides"],
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Gift guides",
    description: "Crawlable gift guides for girlfriends, wives, budgets, and buying angles.",
    url: `${siteUrl}/guides/`,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift guides | ShopForHer</title>
  <meta name="description" content="Browse all ShopForHer gift guides for girlfriends, wives, budgets, and high-converting gift angles.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${siteUrl}/guides/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(collectionPageSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Index</p>
        <h1>Gift guides</h1>
        <p class="discovery-intro">Real landing pages for the main buying intents on ShopForHer.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(formattedDate)}</span>
          <span>${seoGuides.length} pages</span>
        </div>
      </section>
      ${groups
        .map(([groupId, groupTitle]) => {
          const entries = seoGuides.filter((guide) => guide.group === groupId);
          return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Browse</p>
          <h2>${escapeHtml(groupTitle)}</h2>
        </div>
        <div class="discovery-related">
          ${entries
            .map(
              (entry) => `<a class="discovery-related-link" href="/${entry.slug}/">
            <span>${escapeHtml(entry.groupLabel)}</span>
            <strong>${escapeHtml(entry.label)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>`;
        })
        .join("")}
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
        <a href="/llms.txt">llms.txt</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function renderDatesIndex() {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Date spots",
    description: "City date pages with simple booking paths.",
    url: `${siteUrl}/dates/`,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Date spots | ShopForHer</title>
  <meta name="description" content="Simple city date pages with clean booking paths.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${siteUrl}/dates/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(collectionPageSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/dates/">Dates</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Dates</p>
        <h1>Date spots</h1>
        <p class="discovery-intro">Simple city pages for dinner, drinks, and easier booking paths.</p>
      </section>
      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Cities</p>
          <h2>Browse by city</h2>
        </div>
        <div class="discovery-related">
          ${seoDateCities
            .map(
              (city) => `<a class="discovery-related-link" href="/dates/${city.slug}/">
            <span>City</span>
            <strong>${escapeHtml(city.city)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function renderDateCityPage(city) {
  const canonical = `${siteUrl}/dates/${city.slug}/`;
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: city.h1,
    description: city.description,
    url: canonical,
    about: {
      "@type": "Place",
      name: city.city,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Dates", item: `${siteUrl}/dates/` },
      { "@type": "ListItem", position: 3, name: city.city, item: canonical },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(city.title)}</title>
  <meta name="description" content="${escapeHtml(city.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(localBusinessSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/dates/">Dates</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Date spots</p>
        <h1>${escapeHtml(city.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(city.intro)}</p>
        <div class="discovery-meta">
          <span>OpenTable path</span>
          <span>Updated ${escapeHtml(formattedDate)}</span>
        </div>
      </section>
      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Places</p>
          <h2>Simple booking options</h2>
        </div>
        <ol class="discovery-list">
          ${city.spots
            .map(
              (spot, index) => `<li class="discovery-item">
            <div class="discovery-item-head">
              <span class="discovery-rank">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>${escapeHtml(spot.name)}</h3>
                <p class="discovery-price">${escapeHtml(spot.type)} · ${escapeHtml(spot.area)}</p>
              </div>
            </div>
            <p class="discovery-copy">${escapeHtml(spot.note)}</p>
            <div class="discovery-actions">
              <a class="discovery-btn" href="${spot.bookingUrl}" target="_blank" rel="noreferrer">Book with OpenTable</a>
            </div>
          </li>`
            )
            .join("")}
        </ol>
      </section>
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <p>Reservation availability and checkout happen on the booking partner site.</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function renderHotIndex() {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Hot gift trends",
    description: "Trending and viral gift pages for her.",
    url: `${siteUrl}/hot/`,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hot gift trends | ShopForHer</title>
  <meta name="description" content="Trending, viral, and current gift pages for her.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${siteUrl}/hot/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(collectionPageSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/hot/">Hot</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Hot</p>
        <h1>Trending gift pages</h1>
        <p class="discovery-intro">Real pages for the viral side of ShopForHer: fast-moving picks, cleaner buys, and current angles.</p>
      </section>
      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Feed</p>
          <h2>Current stories</h2>
        </div>
        <div class="discovery-related">
          ${seoHotStories
            .map(
              (story) => `<a class="discovery-related-link" href="/hot/${story.slug}/">
            <span>${escapeHtml(story.trendLabel)}</span>
            <strong>${escapeHtml(story.h1)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
        <a href="/llms.txt">llms.txt</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function renderHotStoryPage(story) {
  const items = story.itemIds.map((id) => catalogById.get(id)).filter(Boolean);
  const relatedGuides = story.relatedGuides.map((slug) => guideBySlug.get(slug)).filter(Boolean);
  const canonical = `${siteUrl}/hot/${story.slug}/`;
  const pageTitle = story.title;
  const description = story.description;
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: story.h1,
    description,
    thumbnailUrl: [hotThumbUrl(story)],
    uploadDate: updatedAt,
    url: canonical,
    publisher: {
      "@type": "Organization",
      name: seoSite.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo1.png`,
      },
    },
    keywords: [story.label, "gifts for her", "viral gifts", "trending gifts"],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Hot", item: `${siteUrl}/hot/` },
      { "@type": "ListItem", position: 3, name: story.h1, item: canonical },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="video.other">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${hotThumbUrl(story)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${hotThumbUrl(story)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${jsonLdScript(videoSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    <header class="discovery-header">
      <a class="discovery-brand" href="/">
        <img src="/logo1.png" alt="ShopForHer">
      </a>
      <nav class="discovery-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/guides/">Guides</a>
        <a href="/hot/">Hot</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Hot</p>
        <h1>${escapeHtml(story.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(story.intro)}</p>
        <div class="discovery-meta">
          <span>${escapeHtml(story.trendLabel)}</span>
          <span>${escapeHtml(story.views)}</span>
          <span>${escapeHtml(story.duration)}</span>
        </div>
      </section>

      <section class="discovery-poster">
        <img src="${hotThumbUrl(story)}" alt="${escapeHtml(story.h1)} poster">
        <div class="discovery-poster-copy">
          <span>${escapeHtml(story.label)}</span>
          <strong>${escapeHtml(story.trendLabel)}</strong>
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Products</p>
          <h2>Picks in this story</h2>
        </div>
        <ol class="discovery-list">
          ${items
            .map(
              (gift, index) => `<li class="discovery-item">
            <div class="discovery-item-head">
              <span class="discovery-rank">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
                <p class="discovery-price">${escapeHtml(gift.priceLabel)}</p>
              </div>
            </div>
            <p class="discovery-copy">${escapeHtml(gift.hook)} ${escapeHtml(gift.why)}</p>
            <div class="discovery-actions">
              <a class="discovery-text-link" href="/gift/${gift.slug}/">View product</a>
              <a class="discovery-btn" href="${affiliateUrl(gift.query)}" target="_blank" rel="noreferrer">Buy on Amazon</a>
            </div>
          </li>`
            )
            .join("")}
        </ol>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Related</p>
          <h2>More guides</h2>
        </div>
        <div class="discovery-related">
          ${relatedGuides
            .map(
              (guide) => `<a class="discovery-related-link" href="/${guide.slug}/">
            <span>${escapeHtml(guide.groupLabel)}</span>
            <strong>${escapeHtml(guide.label)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    <footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      <p>Affiliate links may be present. Product checkout happens on the merchant site.</p>
      <div class="discovery-footer-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/affiliate-disclosure.html">Affiliate</a>
        <a href="/llms.txt">llms.txt</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function writeGuidePages() {
  seoGuides.forEach((guide) => {
    const guideDir = path.join(publicDir, guide.slug);
    ensureDir(guideDir);
    fs.writeFileSync(path.join(guideDir, "index.html"), renderGuidePage(guide));
  });

  const guidesDir = path.join(publicDir, "guides");
  ensureDir(guidesDir);
  fs.writeFileSync(path.join(guidesDir, "index.html"), renderGuideIndex());
}

function writeProductPages() {
  const giftDir = path.join(publicDir, "gift");
  ensureDir(giftDir);

  seoCatalog.forEach((gift) => {
    const productDir = path.join(giftDir, gift.slug);
    ensureDir(productDir);
    fs.writeFileSync(path.join(productDir, "index.html"), renderProductPage(gift));
  });
}

function writeDatePages() {
  const datesDir = path.join(publicDir, "dates");
  ensureDir(datesDir);
  fs.writeFileSync(path.join(datesDir, "index.html"), renderDatesIndex());

  seoDateCities.forEach((city) => {
    const cityDir = path.join(datesDir, city.slug);
    ensureDir(cityDir);
    fs.writeFileSync(path.join(cityDir, "index.html"), renderDateCityPage(city));
  });
}

function writeHotPages() {
  const hotDir = path.join(publicDir, "hot");
  ensureDir(hotDir);
  fs.writeFileSync(path.join(hotDir, "index.html"), renderHotIndex());

  seoHotStories.forEach((story) => {
    const storyDir = path.join(hotDir, story.slug);
    ensureDir(storyDir);
    fs.writeFileSync(path.join(storyDir, "index.html"), renderHotStoryPage(story));
  });
}

function writeSitemap() {
  const staticPages = [
    "/",
    "/guides/",
    "/hot/",
    "/dates/",
    "/privacy.html",
    "/terms.html",
    "/affiliate-disclosure.html",
  ];

  const urls = [
    ...staticPages,
    ...seoGuides.map((guide) => `/${guide.slug}/`),
    ...seoHotStories.map((story) => `/hot/${story.slug}/`),
    ...seoDateCities.map((city) => `/dates/${city.slug}/`),
    ...seoCatalog.map((gift) => `/gift/${gift.slug}/`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${updatedAt}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
}

function writeLlmsFiles() {
  const lines = [
    "# ShopForHer",
    "",
    "> Fast gift picks for men buying for her.",
    "",
    "## Main guide index",
    `- ${siteUrl}/guides/`,
    "",
    "## Top guides",
    ...seoGuides.map((guide) => `- [${guide.h1}](${siteUrl}/${guide.slug}/)`),
    "",
    "## Hot pages",
    ...seoHotStories.map((story) => `- [${story.h1}](${siteUrl}/hot/${story.slug}/)`),
    "",
    "## Product pages",
    ...seoCatalog.map((gift) => `- [${gift.name}](${productUrl(gift)})`),
    "",
    "## Date pages",
    ...seoDateCities.map((city) => `- [${city.h1}](${siteUrl}/dates/${city.slug}/)`),
    "",
    "## Notes",
    "- Affiliate links may be present.",
    "- Product checkout happens on the merchant site.",
    "- Updated weekly.",
    "",
    "## Contact",
    "- hello@shopforher.org",
  ].join("\n");

  const full = [
    "# ShopForHer full index",
    "",
    `Base URL: ${siteUrl}/`,
    `Updated: ${updatedAt}`,
    "",
    ...seoGuides.map((guide) => `- ${guide.h1}: ${siteUrl}/${guide.slug}/`),
    ...seoHotStories.map((story) => `- ${story.h1}: ${siteUrl}/hot/${story.slug}/`),
    ...seoDateCities.map((city) => `- ${city.h1}: ${siteUrl}/dates/${city.slug}/`),
    ...seoCatalog.map((gift) => `- ${gift.name}: ${productUrl(gift)}`),
  ].join("\n");

  fs.writeFileSync(path.join(publicDir, "llms.txt"), lines);
  fs.writeFileSync(path.join(publicDir, "llms-full.txt"), full);
}

ensureDir(publicDir);
writeGuidePages();
writeHotPages();
writeProductPages();
writeDatePages();
writeSitemap();
writeLlmsFiles();
