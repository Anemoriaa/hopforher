import fs from "node:fs";
import path from "node:path";
import { seoCatalog, seoDateCities, seoGuides, seoHotStories, seoSite } from "../src/content/seo-guides.js";
import {
  AMAZON_AFFILIATE_REL,
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_PAID_LINK_NOTE,
  buildAffiliateDataAttributes,
} from "../src/lib/affiliate.js";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const siteUrl = seoSite.url;
const updatedAt = seoSite.updatedAt;
const formattedDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${updatedAt}T00:00:00Z`));
const catalogById = new Map(seoCatalog.map((gift) => [gift.id, gift]));
const guideBySlug = new Map(seoGuides.map((guide) => [guide.slug, guide]));
const giftBySlug = new Map(seoCatalog.map((gift) => [gift.slug, gift]));
const trustPages = [
  {
    filename: "about.html",
    title: "About ShopForHer | ShopForHer",
    description: "What ShopForHer is, who it helps, and how the site is structured.",
    kicker: "About",
    h1: "About ShopForHer",
    intro: "ShopForHer is a gift-discovery brand built for men who want a cleaner answer fast when buying for her.",
    schemaType: "AboutPage",
    sections: [
      {
        title: "What the site does",
        body: "The site focuses on gifts for girlfriends, wives, anniversaries, birthdays, budgets, and related date-night ideas. The goal is a short list of stronger options, not endless scrolling.",
      },
      {
        title: "Who it is for",
        body: "ShopForHer is primarily written for men buying for a girlfriend or wife who want faster confidence, clearer tradeoffs, and a more useful shortlist.",
      },
      {
        title: "How the site is organized",
        body: "The main surfaces are Popular, Hot, Guides, product pages, and date pages. Static landing pages exist so search engines and AI assistants can understand the site without needing client-side interaction.",
      },
    ],
  },
  {
    filename: "editorial-policy.html",
    title: "Editorial Policy | ShopForHer",
    description: "How ShopForHer chooses products, writes guide pages, and handles affiliate links.",
    kicker: "Editorial",
    h1: "Editorial policy",
    intro: "ShopForHer is designed to publish clearer gift recommendations, not generic catalog dumps.",
    schemaType: "WebPage",
    sections: [
      {
        title: "Selection method",
        body: "Pages are curated around buyer intent first: relationship stage, budget, use case, and how safe the gift is to buy without extra context. Products are kept when they are easy to understand, present well, and match the promise of the page.",
      },
      {
        title: "What we avoid",
        body: "We try to avoid cluttered roundups, obvious filler picks, and recommendations that only look good in a search result but are weak when someone actually buys them.",
      },
      {
        title: "Affiliate disclosure",
        body: "Some outbound links are paid affiliate links. As an Amazon Associate I earn from qualifying purchases, but that does not change the stated reason a product appears on a page, and checkout still happens on the merchant site.",
      },
      {
        id: "editorial-team",
        title: "Editorial team",
        body: "ShopForHer Editorial Team writes the guide and product pages. The job of the page author is to make the shortlist clearer, lower-risk, and easier to scan for the intended buyer moment.",
      },
      {
        id: "commerce-review",
        title: "Commerce review",
        body: "ShopForHer Commerce Review checks that the product lane, merchant path, price band, and disclosure notes are clear before a guide or product page is regenerated.",
      },
      {
        title: "Evidence and pricing",
        body: "Pages are built from product imagery, merchant details, price bands, buyer-intent fit, and clear off-site checkout paths. Price labels are estimates and final pricing always lives on the merchant site.",
      },
      {
        title: "Freshness",
        body: "Guide pages, hot pages, and supporting discovery files are regenerated regularly so the site can stay crawlable and current for both traditional search and AI-assisted discovery.",
      },
    ],
  },
  {
    filename: "contact.html",
    title: "Contact ShopForHer | ShopForHer",
    description: "How to contact ShopForHer about recommendations, corrections, or brand questions.",
    kicker: "Contact",
    h1: "Contact ShopForHer",
    intro: "Use this page for corrections, brand questions, affiliate issues, or general contact.",
    schemaType: "ContactPage",
    sections: [
      {
        title: "Email",
        body: "Reach the site at hello@shopforher.org.",
      },
      {
        title: "Corrections and updates",
        body: "If a guide is outdated, a link breaks, or a page is misleading, email the page URL and the issue so it can be reviewed.",
      },
      {
        title: "Partnerships",
        body: "For partnerships, media questions, or brand mentions, include context and the exact page or campaign you are asking about.",
      },
    ],
  },
];
const siteOrganizationSchema = {
  "@type": "Organization",
  name: seoSite.name,
  url: `${siteUrl}/`,
  logo: `${siteUrl}/logo1.png`,
  email: seoSite.contactEmail,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: seoSite.contactEmail,
      url: `${siteUrl}${seoSite.contactPath}`,
    },
  ],
};
const editorialAuthor = {
  name: "ShopForHer Editorial Team",
  title: "Gift recommendation editors",
  url: `${siteUrl}${seoSite.editorialPath}#editorial-team`,
};
const editorialReviewer = {
  name: "ShopForHer Commerce Review",
  title: "Commerce review and quality checks",
  url: `${siteUrl}${seoSite.editorialPath}#commerce-review`,
};
const editorialAuthorSchema = {
  "@type": "Organization",
  name: editorialAuthor.name,
  url: editorialAuthor.url,
};
const editorialReviewerSchema = {
  "@type": "Organization",
  name: editorialReviewer.name,
  url: editorialReviewer.url,
};
const priceEstimateNote = "Price labels reflect recent observed ranges and final pricing can change on the merchant site.";

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

function withAffiliateTag(urlValue) {
  const url = new URL(urlValue);
  url.searchParams.set("tag", seoSite.affiliateTag);
  return url.toString();
}

function withoutAffiliateTag(urlValue) {
  const url = new URL(urlValue);
  url.searchParams.delete("tag");
  return url.toString();
}

function affiliateUrl(gift) {
  const asin = gift.amazonAsin || gift.asin;

  if (gift.affiliateUrl) {
    return withAffiliateTag(gift.affiliateUrl);
  }

  if (asin) {
    return withAffiliateTag(`https://www.amazon.com/dp/${asin}`);
  }

  const url = new URL(seoSite.affiliateBaseUrl);
  url.searchParams.set("k", gift.query);
  url.searchParams.set("tag", seoSite.affiliateTag);
  return url.toString();
}

function merchantProductUrl(gift) {
  const asin = gift.amazonAsin || gift.asin;

  if (gift.sourceProductUrl) {
    return gift.sourceProductUrl;
  }

  if (gift.affiliateUrl) {
    return withoutAffiliateTag(gift.affiliateUrl);
  }

  if (asin) {
    return `https://www.amazon.com/dp/${asin}`;
  }

  return "";
}

function merchantName(gift) {
  return gift.merchantName || "Amazon";
}

function usesAffiliateSearchFallback(gift) {
  return !(gift.affiliateUrl || gift.amazonAsin || gift.asin);
}

function affiliateLabel(gift) {
  return usesAffiliateSearchFallback(gift) ? "Find on Amazon" : "Buy on Amazon";
}

function paidLinkNote(gift) {
  return usesAffiliateSearchFallback(gift) ? "Paid search link to Amazon" : AMAZON_PAID_LINK_NOTE;
}

function parsePriceNumbers(priceLabel) {
  return [...String(priceLabel || "").matchAll(/\d+(?:\.\d+)?/g)]
    .map((match) => Number.parseFloat(match[0]))
    .filter((value) => Number.isFinite(value));
}

function priceRange(gift) {
  const values = parsePriceNumbers(gift.priceLabel);

  if (!values.length) {
    return null;
  }

  const low = Math.min(...values);
  const high = Math.max(...values);

  return {
    low,
    high,
    isRange: low !== high,
  };
}

function schemaPrice(value) {
  return value.toFixed(2);
}

function productOfferSchema(gift) {
  const range = priceRange(gift);

  if (!range) {
    return null;
  }

  const offerUrl = merchantProductUrl(gift);
  const sellerName = merchantName(gift);
  const base = {
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: sellerName,
    },
    ...(offerUrl ? { url: offerUrl } : {}),
  };

  if (range.isRange) {
    return {
      "@type": "AggregateOffer",
      ...base,
      lowPrice: schemaPrice(range.low),
      highPrice: schemaPrice(range.high),
    };
  }

  return {
    "@type": "Offer",
    ...base,
    price: schemaPrice(range.low),
  };
}

function guideItems(guide) {
  return guide.itemIds.map((id) => catalogById.get(id)).filter(Boolean);
}

function productUrl(gift) {
  return `${siteUrl}/gift/${gift.slug}/`;
}

function productImages(gift) {
  const images = [...new Set([gift.imageUrl, ...(gift.galleryImages || [])].filter(Boolean))];
  return images.length ? images : [`${siteUrl}/logo1.png`];
}

function primaryImageUrl(gift) {
  return productImages(gift)[0];
}

function guideImageUrl(guide) {
  const firstGift = guideItems(guide)[0];
  return firstGift ? primaryImageUrl(firstGift) : `${siteUrl}/logo1.png`;
}

function hotThumbUrl(story) {
  return `https://picsum.photos/seed/shopforher-${story.slug}/1200/1600`;
}

function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function attributionScriptTag() {
  return `<script defer src="/ai-attribution.js"></script>
  <script defer src="/affiliate-clicks.js"></script>`;
}

function feedLinkTag() {
  return `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(seoSite.name)} feed" href="/feed.xml">`;
}

function renderFooterLinks({ includeLlms = true } = {}) {
  const links = [
    ["About", seoSite.aboutPath],
    ["Editorial", seoSite.editorialPath],
    ["Contact", seoSite.contactPath],
    ["Site map", "/site-map.html"],
    ["Feed", "/feed.xml"],
    ["Catalog JSON", "/product-catalog.json"],
    ["Privacy", "/privacy.html"],
    ["Terms", "/terms.html"],
    ["Affiliate", "/affiliate-disclosure.html"],
  ];

  if (includeLlms) {
    links.push(["llms.txt", "/llms.txt"]);
  }

  return links
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("\n        ");
}

function renderHtmlAttributes(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
}

function renderAffiliateAnchor(gift, placement, label = affiliateLabel(gift)) {
  const attrs = renderHtmlAttributes(buildAffiliateDataAttributes({ gift, placement }));

  return `<a class="discovery-btn" href="${affiliateUrl(gift)}" target="_blank" rel="${AMAZON_AFFILIATE_REL}" ${attrs}>${escapeHtml(label)}</a>`;
}

function renderPaidLinkNote(gift) {
  return `<span class="discovery-paid-note">${escapeHtml(paidLinkNote(gift))}</span>`;
}

function renderDiscoveryFooter({ notes = [], includeLlms = true, includeAffiliateDisclosure = false } = {}) {
  const footerNotes = includeAffiliateDisclosure ? [AMAZON_ASSOCIATE_DISCLOSURE, ...notes] : notes;

  return `<footer class="discovery-footer">
      <p>${escapeHtml(seoSite.description)}</p>
      ${footerNotes.map((note) => `<p>${escapeHtml(note)}</p>`).join("\n      ")}
      <div class="discovery-footer-links">
        ${renderFooterLinks({ includeLlms })}
      </div>
      <a href="mailto:${seoSite.contactEmail}">${seoSite.contactEmail}</a>
    </footer>`;
}

function renderGuideMethodSection(guide) {
  const cards = [
    ["Written by", `${editorialAuthor.name} · ${editorialAuthor.title}`],
    ["Reviewed by", `${editorialReviewer.name} · ${editorialReviewer.title}`],
    ["How we picked these", guide.selectionMethod || "This page is curated around fit, buying confidence, and how safely each gift matches the page promise."],
    ["Use this page when", guide.bestUseCase || "Use this page when the page title closely matches the actual occasion, budget, or relationship stage you are buying for."],
    ["Skip this page when", guide.avoidWhen || "Skip this page when a different page on the site matches your moment or budget more directly."],
    ["Pricing note", priceEstimateNote],
  ];

  return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Editorial</p>
          <h2>Why you can trust this page</h2>
        </div>
        <div class="discovery-faqs">
          ${cards
            .map(
              ([title, body]) => `<article class="discovery-faq">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(body)}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>`;
}

function renderProductEditorialSection(gift) {
  const cards = [
    ["Written by", `${editorialAuthor.name} · ${editorialAuthor.title}`],
    ["Reviewed by", `${editorialReviewer.name} · ${editorialReviewer.title}`],
    [
      "How this pick is checked",
      "A product stays live when the merchant path is clear, the price band fits the promise of the page, and the item feels differentiated enough to be a real gift rather than filler.",
    ],
    [
      "Merchant path",
      usesAffiliateSearchFallback(gift)
        ? "This page currently uses an Amazon search path for checkout because a pinned direct merchant listing is not yet stored in the catalog."
        : "This page links out to a direct merchant listing and all checkout still happens off-site.",
    ],
    ["Pricing note", priceEstimateNote],
  ];

  return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Editorial</p>
          <h2>How this pick was reviewed</h2>
        </div>
        <div class="discovery-faqs">
          ${cards
            .map(
              ([title, body]) => `<article class="discovery-faq">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(body)}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>`;
}

function renderGuideSignalsSection(guide) {
  if (!guide.buyerSignals?.length) {
    return "";
  }

  return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Buyer read</p>
          <h2>What usually works here</h2>
        </div>
        <div class="discovery-faqs">
          ${guide.buyerSignals
            .map(
              (signal) => `<article class="discovery-faq">
            <h3>${escapeHtml(signal.title)}</h3>
            <p>${escapeHtml(signal.body)}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>`;
}

function renderGuideBestFitsSection(guide) {
  if (!guide.bestFits?.length) {
    return "";
  }

  return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Decision guide</p>
          <h2>Best if she likes...</h2>
        </div>
        <div class="discovery-decision-grid">
          ${guide.bestFits
            .map((entry) => {
              const gift = catalogById.get(entry.giftId);

              return `<article class="discovery-decision-card">
            <span class="discovery-decision-label">Best if</span>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.body)}</p>
            ${gift ? `<a class="discovery-text-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)} · ${escapeHtml(gift.priceLabel)}</a>` : ""}
          </article>`;
            })
            .join("")}
        </div>
      </section>`;
}

function renderGuideAvoidSection(guide) {
  if (!guide.avoidNotes?.length) {
    return "";
  }

  return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Avoid</p>
          <h2>Skip these moves if...</h2>
        </div>
        <div class="discovery-faqs">
          ${guide.avoidNotes
            .map(
              (note) => `<article class="discovery-faq">
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.body)}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>`;
}

function renderGuidePickLanesSection(guide) {
  if (!guide.pickLanes?.length) {
    return "";
  }

  return `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Short answer</p>
          <h2>Best pick by budget or use case</h2>
        </div>
        <div class="discovery-decision-grid">
          ${guide.pickLanes
            .map((entry) => {
              const gift = catalogById.get(entry.giftId);

              return `<article class="discovery-decision-card">
            <span class="discovery-decision-label">${escapeHtml(entry.title)}</span>
            <h3>${gift ? `<a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a>` : escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.body)}</p>
            ${gift ? `<p class="discovery-best-for">Best for: ${escapeHtml(gift.bestFor)}</p>` : ""}
          </article>`;
            })
            .join("")}
        </div>
      </section>`;
}

function guideFaqs(guide, items) {
  if (guide.faqs?.length) {
    return guide.faqs;
  }

  return [
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
}

function renderGuidePage(guide) {
  const items = guideItems(guide);
  const related = guide.related.map((slug) => guideBySlug.get(slug)).filter(Boolean);
  const canonical = `${siteUrl}/${guide.slug}/`;
  const pageTitle = guide.title;
  const faqs = guideFaqs(guide, items);
  const pageImage = guideImageUrl(guide);

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
      url: productUrl(gift),
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
    dateModified: updatedAt,
    mainEntityOfPage: canonical,
    author: editorialAuthorSchema,
    reviewedBy: editorialReviewerSchema,
    publisher: siteOrganizationSchema,
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
  <meta property="og:image" content="${escapeHtml(pageImage)}">
  <meta property="article:modified_time" content="${updatedAt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(guide.description)}">
  <meta name="twitter:image" content="${escapeHtml(pageImage)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${feedLinkTag()}
  ${attributionScriptTag()}
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
          <span>Off-site merchant checkout</span>
        </div>
      </section>

      ${renderGuideMethodSection(guide)}
      ${renderGuideSignalsSection(guide)}
      ${renderGuideBestFitsSection(guide)}
      ${renderGuideAvoidSection(guide)}
      ${renderGuidePickLanesSection(guide)}

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
              ${renderAffiliateAnchor(gift, `guide-${guide.slug}-list`)}
              ${renderPaidLinkNote(gift)}
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
    ${renderDiscoveryFooter({
      notes: [
        "Pages are curated for fit, occasion, and buying confidence rather than exhaustive coverage.",
      ],
      includeAffiliateDisclosure: true,
    })}
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
  const images = productImages(gift);
  const primaryImage = primaryImageUrl(gift);
  const offerSchema = productOfferSchema(gift);
  const productSchemaId = `${canonical}#product`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productSchemaId,
    name: gift.name,
    description,
    url: canonical,
    mainEntityOfPage: canonical,
    category: "Gift for her",
    sku: gift.id,
    image: images,
    ...(gift.brand
      ? {
          brand: {
            "@type": "Brand",
            name: gift.brand,
          },
        }
      : {}),
    ...(gift.amazonAsin
      ? {
          productID: `ASIN:${gift.amazonAsin}`,
          identifier: {
            "@type": "PropertyValue",
            propertyID: "ASIN",
            value: gift.amazonAsin,
          },
        }
      : {}),
    ...(gift.sourceProductUrl ? { sameAs: gift.sourceProductUrl } : {}),
    ...(offerSchema ? { offers: offerSchema } : {}),
  };

  const productPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description,
    url: canonical,
    dateModified: updatedAt,
    author: editorialAuthorSchema,
    reviewedBy: editorialReviewerSchema,
    mainEntity: {
      "@id": productSchemaId,
    },
    publisher: siteOrganizationSchema,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
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
  <meta property="og:image" content="${escapeHtml(primaryImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(primaryImage)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${feedLinkTag()}
  ${attributionScriptTag()}
  ${jsonLdScript(productSchema)}
  ${jsonLdScript(productPageSchema)}
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
          <span>Off-site merchant checkout</span>
        </div>
      </section>

      ${renderProductEditorialSection(gift)}

      <section class="discovery-product-media">
        <figure class="discovery-product-image">
          <img src="${escapeHtml(primaryImage)}" alt="${escapeHtml(gift.name)}">
        </figure>
        ${
          images.length > 1
            ? `<div class="discovery-product-gallery">
          ${images
            .slice(1, 7)
            .map(
              (imageUrl, index) => `<figure class="discovery-product-thumb">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(`${gift.name} image ${index + 2}`)}">
          </figure>`
            )
            .join("")}
        </div>`
            : ""
        }
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
            <p>${
              usesAffiliateSearchFallback(gift)
                ? "Use the Amazon search link here to find the current listing, then finish checkout on the merchant site."
                : "Open the merchant listing here, then finish checkout on the merchant site."
            }</p>
          </article>
        </div>
        <div class="discovery-actions">
          ${renderAffiliateAnchor(gift, `product-${gift.slug}-primary`)}
          ${renderPaidLinkNote(gift)}
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
    ${renderDiscoveryFooter({
      notes: [
        "Checkout and final pricing happen on the merchant site.",
      ],
      includeAffiliateDisclosure: true,
    })}
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
    publisher: siteOrganizationSchema,
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
  ${feedLinkTag()}
  ${attributionScriptTag()}
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
    ${renderDiscoveryFooter({
      notes: ["Guide pages are organized around relationship, budget, and buying angle."],
    })}
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
    publisher: siteOrganizationSchema,
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
  ${feedLinkTag()}
  ${attributionScriptTag()}
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
    ${renderDiscoveryFooter({
      notes: ["Date pages summarize cleaner planning lanes and hand off to external booking or map destinations."],
      includeAffiliateDisclosure: false,
    })}
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
    mainEntityOfPage: canonical,
    publisher: siteOrganizationSchema,
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
  ${feedLinkTag()}
  ${attributionScriptTag()}
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
    ${renderDiscoveryFooter({
      notes: ["Reservation availability and checkout happen on the destination booking or map partner site."],
      includeAffiliateDisclosure: false,
    })}
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
    publisher: siteOrganizationSchema,
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
  ${feedLinkTag()}
  ${attributionScriptTag()}
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
    ${renderDiscoveryFooter({
      notes: ["Hot pages focus on faster-moving gift angles and trend-shaped buying behavior."],
    })}
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
      ...siteOrganizationSchema,
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
  ${feedLinkTag()}
  ${attributionScriptTag()}
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
              ${renderAffiliateAnchor(gift, `hot-${story.slug}-list`)}
              ${renderPaidLinkNote(gift)}
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
    ${renderDiscoveryFooter({
      notes: [
        "Product checkout happens on the merchant site.",
      ],
      includeAffiliateDisclosure: true,
    })}
  </div>
</body>
</html>`;
}

function renderTrustPage(page) {
  const canonical = `${siteUrl}/${page.filename}`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    name: page.h1,
    description: page.description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
    about: siteOrganizationSchema,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/logo1.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${siteUrl}/logo1.png">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${feedLinkTag()}
  ${attributionScriptTag()}
  ${jsonLdScript(pageSchema)}
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
        <a href="/dates/">Dates</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">${escapeHtml(page.kicker)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(page.intro)}</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(formattedDate)}</span>
          <span>${escapeHtml(seoSite.name)}</span>
        </div>
      </section>
      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Details</p>
          <h2>What to know</h2>
        </div>
        <div class="discovery-faqs">
          ${page.sections
            .map(
              (section) => `<article class="discovery-faq"${section.id ? ` id="${escapeHtml(section.id)}"` : ""}>
            <h3>${escapeHtml(section.title)}</h3>
            <p>${escapeHtml(section.body)}</p>
          </article>`
            )
            .join("")}
        </div>
      </section>
    </main>
    ${renderDiscoveryFooter({
      notes: ["These pages exist so users, search engines, and AI assistants can understand the site and how it operates."],
    })}
  </div>
</body>
</html>`;
}

function renderSiteMapPage() {
  const canonical = `${siteUrl}/site-map.html`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Site map",
    description: "Browse ShopForHer guides, hot pages, date pages, product pages, and trust pages in one crawlable index.",
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
    about: siteOrganizationSchema,
  };

  const sections = [
    {
      kicker: "Trust",
      title: "Trust pages",
      links: trustPages.map((page) => ({
        href: `/${page.filename}`,
        label: page.h1,
        meta: page.kicker,
      })),
    },
    {
      kicker: "Guides",
      title: "Gift guides",
      links: seoGuides.map((guide) => ({
        href: `/${guide.slug}/`,
        label: guide.h1,
        meta: guide.groupLabel,
      })),
    },
    {
      kicker: "Hot",
      title: "Trending pages",
      links: seoHotStories.map((story) => ({
        href: `/hot/${story.slug}/`,
        label: story.h1,
        meta: story.label,
      })),
    },
    {
      kicker: "Dates",
      title: "Date pages",
      links: [{ href: "/dates/", label: "Date spots", meta: "Index" }].concat(
        seoDateCities.map((city) => ({
          href: `/dates/${city.slug}/`,
          label: city.h1,
          meta: city.city,
        }))
      ),
    },
    {
      kicker: "Products",
      title: "Product pages",
      links: seoCatalog.map((gift) => ({
        href: `/gift/${gift.slug}/`,
        label: gift.name,
        meta: gift.badge,
      })),
    },
    {
      kicker: "Machine-readable",
      title: "Discovery files",
      links: [
        { href: "/feed.xml", label: "RSS feed", meta: "RSS" },
        { href: "/product-catalog.json", label: "Product catalog", meta: "JSON" },
        { href: "/llms.txt", label: "llms.txt", meta: "LLMs" },
        { href: "/llms-full.txt", label: "llms-full.txt", meta: "LLMs" },
      ],
    },
  ];
  const linkedCount = sections.reduce((total, section) => total + section.links.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site map | ShopForHer</title>
  <meta name="description" content="Browse every ShopForHer guide, product page, date page, hot page, and trust page from one crawlable site map.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="Site map | ShopForHer">
  <meta property="og:description" content="Browse every ShopForHer guide, product page, date page, hot page, and trust page from one crawlable site map.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/logo1.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Site map | ShopForHer">
  <meta name="twitter:description" content="Browse every ShopForHer guide, product page, date page, hot page, and trust page from one crawlable site map.">
  <meta name="twitter:image" content="${siteUrl}/logo1.png">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${feedLinkTag()}
  ${attributionScriptTag()}
  ${jsonLdScript(pageSchema)}
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
        <a href="/dates/">Dates</a>
      </nav>
    </header>
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Directory</p>
        <h1>Site map</h1>
        <p class="discovery-intro">A full HTML index of the main ShopForHer pages for users, search engines, and AI assistants.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(formattedDate)}</span>
          <span>${linkedCount} links surfaced</span>
        </div>
      </section>
      ${sections
        .map(
          (section) => `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">${escapeHtml(section.kicker)}</p>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="discovery-related">
          ${section.links
            .map(
              (entry) => `<a class="discovery-related-link" href="${entry.href}">
            <span>${escapeHtml(entry.meta)}</span>
            <strong>${escapeHtml(entry.label)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>`
        )
        .join("")}
    </main>
    ${renderDiscoveryFooter({
      notes: [
        "Use this page when you want a readable directory instead of the XML sitemap.",
        "The RSS feed is available at /feed.xml.",
        "A machine-readable product catalog is available at /product-catalog.json.",
      ],
    })}
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

function writeTrustPages() {
  trustPages.forEach((page) => {
    fs.writeFileSync(path.join(publicDir, page.filename), renderTrustPage(page));
  });
}

function writeSiteMapPage() {
  fs.writeFileSync(path.join(publicDir, "site-map.html"), renderSiteMapPage());
}

function writeFeed() {
  const pubDate = new Date(updatedAt).toUTCString();
  const items = [
    ...trustPages.map((page) => ({
      title: page.h1,
      url: `${siteUrl}/${page.filename}`,
      description: page.description,
    })),
    ...seoGuides.map((guide) => ({
      title: guide.h1,
      url: `${siteUrl}/${guide.slug}/`,
      description: guide.description,
    })),
    ...seoHotStories.map((story) => ({
      title: story.h1,
      url: `${siteUrl}/hot/${story.slug}/`,
      description: story.description,
    })),
    ...seoDateCities.map((city) => ({
      title: city.h1,
      url: `${siteUrl}/dates/${city.slug}/`,
      description: city.description,
    })),
    ...seoCatalog.map((gift) => ({
      title: gift.name,
      url: productUrl(gift),
      description: `${gift.hook} ${gift.why}`,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(seoSite.name)}</title>
    <description>${escapeHtml(seoSite.description)}</description>
    <link>${siteUrl}/</link>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <language>en-us</language>
${items
  .map(
    (item) => `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeHtml(item.description)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;

  fs.writeFileSync(path.join(publicDir, "feed.xml"), xml);
}

function buildProductCatalogEntries() {
  return seoCatalog.map((gift) => {
    const range = priceRange(gift);

    return {
      id: gift.id,
      slug: gift.slug,
      name: gift.name,
      brand: gift.brand || null,
      pageUrl: productUrl(gift),
      affiliateUrl: affiliateUrl(gift),
      merchantName: merchantName(gift),
      merchantProductUrl: merchantProductUrl(gift) || null,
      affiliatePathType: usesAffiliateSearchFallback(gift) ? "amazon-search" : "direct-product",
      checkout: "offsite",
      price: {
        currency: "USD",
        display: gift.priceLabel,
        low: range ? range.low : null,
        high: range ? range.high : null,
      },
      availability: "https://schema.org/InStock",
      asin: gift.amazonAsin || null,
      image: primaryImageUrl(gift),
      additionalImages: productImages(gift).slice(1),
      summary: gift.why,
      bestFor: gift.bestFor,
      updatedAt,
    };
  });
}

function writeProductCatalog() {
  const payload = {
    generatedAt: `${updatedAt}T00:00:00Z`,
    site: {
      name: seoSite.name,
      url: `${siteUrl}/`,
      productCatalogUrl: `${siteUrl}/product-catalog.json`,
      editorialPolicyUrl: `${siteUrl}${seoSite.editorialPath}`,
      affiliateDisclosure: AMAZON_ASSOCIATE_DISCLOSURE,
      checkout: "offsite",
    },
    products: buildProductCatalogEntries(),
  };

  fs.writeFileSync(path.join(publicDir, "product-catalog.json"), `${JSON.stringify(payload, null, 2)}\n`);
}

function writeSitemap() {
  const staticPages = [
    "/",
    "/guides/",
    "/hot/",
    "/dates/",
    "/site-map.html",
    "/feed.xml",
    "/product-catalog.json",
    "/llms.txt",
    "/llms-full.txt",
    seoSite.aboutPath,
    seoSite.editorialPath,
    seoSite.contactPath,
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
    `- ${siteUrl}/site-map.html`,
    `- ${siteUrl}/feed.xml`,
    `- ${siteUrl}/product-catalog.json`,
    "",
    "## Trust pages",
    `- [About ShopForHer](${siteUrl}${seoSite.aboutPath})`,
    `- [Editorial policy](${siteUrl}${seoSite.editorialPath})`,
    `- [Contact ShopForHer](${siteUrl}${seoSite.contactPath})`,
    "",
    "## Discovery files",
    `- [RSS feed](${siteUrl}/feed.xml)`,
    `- [Product catalog JSON](${siteUrl}/product-catalog.json)`,
    `- [llms.txt](${siteUrl}/llms.txt)`,
    `- [llms-full.txt](${siteUrl}/llms-full.txt)`,
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
    "- Editorial policy is published on-site.",
    "- Product catalog JSON includes merchant-path and price-band metadata.",
    "- Updated whenever the catalog is regenerated.",
    "",
    "## Contact",
    `- ${seoSite.contactEmail}`,
  ].join("\n");

  const full = [
    "# ShopForHer full index",
    "",
    `Base URL: ${siteUrl}/`,
    `Updated: ${updatedAt}`,
    "",
    `- About: ${siteUrl}${seoSite.aboutPath}`,
    `- Editorial policy: ${siteUrl}${seoSite.editorialPath}`,
    `- Contact: ${siteUrl}${seoSite.contactPath}`,
    `- Site map: ${siteUrl}/site-map.html`,
    `- Feed: ${siteUrl}/feed.xml`,
    `- Product catalog: ${siteUrl}/product-catalog.json`,
    `- llms.txt: ${siteUrl}/llms.txt`,
    `- llms-full.txt: ${siteUrl}/llms-full.txt`,
    ...seoGuides.map((guide) => `- ${guide.h1}: ${siteUrl}/${guide.slug}/`),
    ...seoHotStories.map((story) => `- ${story.h1}: ${siteUrl}/hot/${story.slug}/`),
    ...seoDateCities.map((city) => `- ${city.h1}: ${siteUrl}/dates/${city.slug}/`),
    ...seoCatalog.map((gift) => `- ${gift.name}: ${productUrl(gift)}`),
  ].join("\n");

  fs.writeFileSync(path.join(publicDir, "llms.txt"), lines);
  fs.writeFileSync(path.join(publicDir, "llms-full.txt"), full);
}

ensureDir(publicDir);
writeTrustPages();
writeSiteMapPage();
writeGuidePages();
writeHotPages();
writeProductPages();
writeDatePages();
writeFeed();
writeProductCatalog();
writeSitemap();
writeLlmsFiles();
