import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { seoCatalog, seoDateCities, seoGuides, seoHotStories, seoSite } from "../src/content/seo-guides.js";
import {
  AMAZON_AFFILIATE_REL,
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_PAID_LINK_NOTE,
  DIRECT_MERCHANT_LINK_NOTE,
  buildAffiliateDataAttributes,
} from "../src/lib/affiliate.js";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const lastmodCachePath = path.join(rootDir, "scripts", ".seo-lastmod-cache.json");
const siteUrl = seoSite.url;
const updatedAt = seoSite.updatedAt;
const catalogById = new Map(seoCatalog.map((gift) => [gift.id, gift]));
const guideBySlug = new Map(seoGuides.map((guide) => [guide.slug, guide]));
const giftBySlug = new Map(seoCatalog.map((gift) => [gift.slug, gift]));
const suppressedGuideSlugs = new Set([
  "birthday-gifts-for-girlfriend",
  "birthday-gifts-for-wife",
  "new-relationship-gifts-for-her",
  "last-minute-gifts-for-her",
  "date-night-gifts-for-her",
]);
const lastmodPlaceholder = {
  isoDate: "__LASTMOD_DATE__",
  dateTime: "__LASTMOD_DATE_TIME__",
  displayDate: "__LASTMOD_DISPLAY__",
};
const heavyGuideReuseThreshold = 5;
const distinctiveGuideReuseThreshold = 3;
const guideDistinctiveTarget = 2;
const guideExpansionUsageThreshold = 2;
const guideExpansionCount = 3;
const keywordStopwords = new Set([
  "and",
  "are",
  "best",
  "buy",
  "buys",
  "for",
  "from",
  "gift",
  "gifts",
  "her",
  "hers",
  "into",
  "its",
  "just",
  "more",
  "most",
  "not",
  "now",
  "off",
  "out",
  "page",
  "pages",
  "she",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "those",
  "use",
  "when",
  "with",
  "you",
  "your",
]);
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
        body: "Guide pages, hot pages, and supporting discovery files are regenerated regularly. Last-modified dates are preserved per page and only move when that page or discovery file actually changes.",
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
const editorialPolicyUrl = `${siteUrl}${seoSite.editorialPath}`;
const aboutPageUrl = `${siteUrl}/about.html`;
const contactPageUrl = `${siteUrl}${seoSite.contactPath}`;
const trustResourceLinks = [
  {
    href: seoSite.editorialPath,
    url: editorialPolicyUrl,
    label: "Editorial policy",
    meta: "Selection method and disclosures",
  },
  {
    href: "/about.html",
    url: aboutPageUrl,
    label: "About ShopForHer",
    meta: "Who the site is for",
  },
  {
    href: seoSite.contactPath,
    url: contactPageUrl,
    label: "Contact",
    meta: "Corrections and questions",
  },
];
const previousLastmodCache = readLastmodCache();
const nextLastmodCache = {};

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${dateValue}T00:00:00Z`));
}

function fullDateTime(dateValue) {
  return `${dateValue}T00:00:00Z`;
}

function pageFreshness(dateValue) {
  return {
    isoDate: dateValue,
    dateTime: fullDateTime(dateValue),
    displayDate: formatDate(dateValue),
  };
}

function readLastmodCache() {
  if (!fs.existsSync(lastmodCachePath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(lastmodCachePath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function hashContent(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function resolveLastmod(url, previewValue) {
  const hash = hashContent(previewValue);
  const previous = previousLastmodCache[url];
  const lastmod = previous?.hash === hash && previous?.lastmod ? previous.lastmod : updatedAt;

  nextLastmodCache[url] = { hash, lastmod };
  return lastmod;
}

function pageLastmod(url, fallback = updatedAt) {
  return nextLastmodCache[url]?.lastmod || previousLastmodCache[url]?.lastmod || fallback;
}

function latestLastmod(urls = []) {
  if (!urls.length) {
    return updatedAt;
  }

  return urls.reduce((latest, url) => {
    const current = pageLastmod(url, updatedAt);
    return current > latest ? current : latest;
  }, "0000-00-00");
}

function utcPubDate(dateValue) {
  return new Date(fullDateTime(dateValue)).toUTCString();
}

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
  return !merchantProductUrl(gift);
}

function usesDirectMerchantPath(gift) {
  return Boolean(gift.sourceProductUrl && !gift.affiliateUrl && !(gift.amazonAsin || gift.asin));
}

function productIndexState(gift) {
  if (usesAffiliateSearchFallback(gift)) {
    return {
      indexable: false,
      reason: "merchant-search-fallback",
    };
  }

  return {
    indexable: true,
    reason: usesDirectMerchantPath(gift) ? "direct-merchant-url" : "direct-merchant-path",
  };
}

function isIndexableProductPage(gift) {
  return productIndexState(gift).indexable;
}

function productRobotsContent(gift) {
  return isIndexableProductPage(gift)
    ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
}

const indexableSeoCatalog = seoCatalog.filter((gift) => isIndexableProductPage(gift));
const indexableSeoGuides = seoGuides.filter((guide) => !suppressedGuideSlugs.has(guide.slug));

function affiliateLabel(gift) {
  if (usesAffiliateSearchFallback(gift)) {
    return "Find on Amazon";
  }

  if (usesDirectMerchantPath(gift) && merchantName(gift) !== "Amazon") {
    return `Visit ${merchantName(gift)}`;
  }

  return "Buy now";
}

function paidLinkNote(gift) {
  if (usesAffiliateSearchFallback(gift)) {
    return "Paid search link to Amazon";
  }

  return usesDirectMerchantPath(gift) ? DIRECT_MERCHANT_LINK_NOTE : AMAZON_PAID_LINK_NOTE;
}

function commerceUrl(gift) {
  return merchantProductUrl(gift) || affiliateUrl(gift);
}

function commerceRel(gift) {
  return usesDirectMerchantPath(gift) ? "noopener noreferrer" : AMAZON_AFFILIATE_REL;
}

function commerceLinkType(gift) {
  return usesDirectMerchantPath(gift) ? "merchant" : "amazon";
}

function guideIndexState(guide) {
  return suppressedGuideSlugs.has(guide.slug)
    ? {
        indexable: false,
        reason: "overlap-suppressed",
      }
    : {
        indexable: true,
        reason: "search-facing",
      };
}

function isIndexableGuidePage(guide) {
  return guideIndexState(guide).indexable;
}

function guideRobotsContent(guide) {
  return isIndexableGuidePage(guide)
    ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
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

function priceMidpoint(gift) {
  const range = priceRange(gift);

  if (!range) {
    return null;
  }

  return (range.low + range.high) / 2;
}

function descriptorTokens(value) {
  return [...new Set(
    String(value || "")
      .toLowerCase()
      .split(/\/|,|\s+or\s+|\s+and\s+/g)
      .map((token) => token.trim())
      .filter((token) => token && token !== "her" && token.length > 1)
  )];
}

function keywordTokens(...values) {
  return [...new Set(
    values
      .flatMap((value) => String(value || "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, " ")
        .split(/\s+/g))
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !keywordStopwords.has(token))
  )];
}

function countSharedDescriptors(left, right) {
  const rightTokens = new Set(descriptorTokens(right));

  return descriptorTokens(left).filter((token) => rightTokens.has(token)).length;
}

function countSharedGuides(sourceGiftId, candidateGiftId) {
  return indexableSeoGuides.reduce((total, guide) => {
    return total + (guide.itemIds.includes(sourceGiftId) && guide.itemIds.includes(candidateGiftId) ? 1 : 0);
  }, 0);
}

function relatedProductScore(source, candidate) {
  let score = 0;

  if (source.badge && candidate.badge && source.badge === candidate.badge) {
    score += 24;
  }

  if (source.brand && candidate.brand && source.brand === candidate.brand) {
    score += 8;
  }

  if (source.vibe && candidate.vibe && source.vibe === candidate.vibe) {
    score += 8;
  }

  score += countSharedDescriptors(source.bestFor, candidate.bestFor) * 10;
  score += countSharedGuides(source.id, candidate.id) * 14;

  const sourcePrice = priceRange(source);
  const candidatePrice = priceRange(candidate);

  if (sourcePrice && candidatePrice) {
    const delta = Math.abs(sourcePrice.low - candidatePrice.low);

    if (delta <= 20) {
      score += 12;
    } else if (delta <= 50) {
      score += 8;
    } else if (delta <= 100) {
      score += 4;
    }
  }

  return score;
}

function relatedProductsForGift(gift) {
  return [...indexableSeoCatalog]
    .filter((entry) => entry.id !== gift.id)
    .sort((left, right) => {
      const scoreDelta = relatedProductScore(gift, right) - relatedProductScore(gift, left);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 6);
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

function hotStoryItems(story) {
  return story.itemIds.map((id) => catalogById.get(id)).filter(Boolean);
}

function hotStoriesForGift(gift) {
  return seoHotStories.filter((story) => story.itemIds.includes(gift.id));
}

function hotStoryUsageCount(giftId) {
  return seoHotStories.reduce((total, story) => total + (story.itemIds.includes(giftId) ? 1 : 0), 0);
}

function hotStoriesForGuide(guide, items = guideItems(guide)) {
  const itemIds = new Set(items.map((gift) => gift.id));

  return seoHotStories
    .map((story) => {
      const sharedItems = hotStoryItems(story).filter((gift) => itemIds.has(gift.id));

      return {
        story,
        sharedItems,
        sharedCount: sharedItems.length,
      };
    })
    .filter((entry) => entry.sharedCount > 0)
    .sort((left, right) => right.sharedCount - left.sharedCount || left.story.h1.localeCompare(right.story.h1));
}

function guideUsageCount(giftId) {
  return indexableSeoGuides.reduce((total, guide) => total + (guide.itemIds.includes(giftId) ? 1 : 0), 0);
}

function guideBudgetCap(guide) {
  const match = `${guide.label} ${guide.h1} ${guide.title}`.match(/under\s*\$?(\d+)/i);

  return match ? Number.parseInt(match[1], 10) : null;
}

function guideKeywordSet(guide) {
  return new Set(keywordTokens(
    guide.label,
    guide.h1,
    guide.description,
    guide.intro,
    guide.selectionMethod,
    guide.bestUseCase,
    guide.avoidWhen,
    ...(guide.buyerSignals || []).map((entry) => `${entry.title} ${entry.body}`),
    ...(guide.bestFits || []).map((entry) => `${entry.title} ${entry.body}`),
    ...(guide.pickLanes || []).map((entry) => `${entry.title} ${entry.body}`)
  ));
}

function guideExpansionScore(guide, items, keywordSet, budgetCap, candidate) {
  if (!isIndexableProductPage(candidate) || items.some((entry) => entry.id === candidate.id)) {
    return Number.NEGATIVE_INFINITY;
  }

  const usageCount = guideUsageCount(candidate.id);

  if (usageCount > guideExpansionUsageThreshold) {
    return Number.NEGATIVE_INFINITY;
  }

  const price = priceRange(candidate);

  if (budgetCap && price && price.low > budgetCap) {
    return Number.NEGATIVE_INFINITY;
  }

  const candidateTokens = keywordTokens(candidate.name, candidate.brand, candidate.badge, candidate.bestFor, candidate.hook, candidate.why);
  const keywordOverlap = candidateTokens.filter((token) => keywordSet.has(token)).length;
  const descriptorOverlap = items.reduce((best, item) => {
    return Math.max(best, countSharedDescriptors(item.bestFor, candidate.bestFor));
  }, 0);
  const badgeOverlap = items.some((item) => item.badge === candidate.badge) ? 1 : 0;
  const usageBonus = usageCount === 0 ? 24 : usageCount === 1 ? 16 : 8;
  const budgetBonus = budgetCap && price && price.high <= budgetCap ? 8 : 0;

  return (keywordOverlap * 16) + (descriptorOverlap * 10) + (badgeOverlap * 6) + usageBonus + budgetBonus;
}

function guideExpansionProducts(guide, items = guideItems(guide)) {
  const keywordSet = guideKeywordSet(guide);
  const budgetCap = guideBudgetCap(guide);

  return [...indexableSeoCatalog]
    .map((candidate) => ({
      candidate,
      score: guideExpansionScore(guide, items, keywordSet, budgetCap, candidate),
    }))
    .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const usageDelta = guideUsageCount(left.candidate.id) - guideUsageCount(right.candidate.id);

      if (usageDelta !== 0) {
        return usageDelta;
      }

      return left.candidate.name.localeCompare(right.candidate.name);
    })
    .slice(0, guideExpansionCount)
    .map((entry) => entry.candidate);
}

function guideOverlapDetails(guide, items = guideItems(guide)) {
  const relatedGuides = (guide.related || []).map((slug) => guideBySlug.get(slug)).filter(Boolean).filter(isIndexableGuidePage);
  const relatedItemIds = new Set(relatedGuides.flatMap((entry) => entry.itemIds || []));
  const uniqueAgainstRelated = items.filter((gift) => !relatedItemIds.has(gift.id));
  const distinctiveItems = (uniqueAgainstRelated.length ? uniqueAgainstRelated : [...items].sort((left, right) => {
    const reuseDelta = guideUsageCount(left.id) - guideUsageCount(right.id);

    if (reuseDelta !== 0) {
      return reuseDelta;
    }

    return left.name.localeCompare(right.name);
  })).slice(0, 3);
  const overusedItems = items.filter((gift) => guideUsageCount(gift.id) >= heavyGuideReuseThreshold);
  const topHeavyCount = items.slice(0, 3).filter((gift) => guideUsageCount(gift.id) >= heavyGuideReuseThreshold).length;
  const relatedOverlap = relatedGuides
    .map((entry) => {
      const sharedItems = items.filter((gift) => entry.itemIds.includes(gift.id));

      return {
        slug: entry.slug,
        label: entry.label,
        h1: entry.h1,
        url: guideUrl(entry),
        sharedCount: sharedItems.length,
        sharedItems: sharedItems.map((gift) => ({
          id: gift.id,
          name: gift.name,
          slug: gift.slug,
          url: productUrl(gift),
        })),
      };
    })
    .filter((entry) => entry.sharedCount > 0)
    .sort((left, right) => right.sharedCount - left.sharedCount || left.label.localeCompare(right.label));

  return {
    distinctiveItems,
    overusedItems,
    relatedOverlap,
    topHeavyCount,
    needsEditorialRefresh:
      distinctiveItems.filter((gift) => guideUsageCount(gift.id) <= distinctiveGuideReuseThreshold).length < guideDistinctiveTarget
      || topHeavyCount >= 2,
  };
}

function logGuideOverlapWarnings() {
  const flagged = indexableSeoGuides
    .map((guide) => {
      const items = guideItems(guide);
      const overlap = guideOverlapDetails(guide, items);

      if (!overlap.needsEditorialRefresh) {
        return null;
      }

      return {
        slug: guide.slug,
        overusedItems: overlap.overusedItems,
      };
    })
    .filter(Boolean);

  if (!flagged.length) {
    return;
  }

  const topRepeatedProducts = [...new Set(flagged.flatMap((entry) => entry.overusedItems.map((gift) => gift.id)))]
    .map((giftId) => catalogById.get(giftId))
    .filter(Boolean)
    .sort((left, right) => guideUsageCount(right.id) - guideUsageCount(left.id) || left.name.localeCompare(right.name))
    .slice(0, 8)
    .map((gift) => `${gift.name} (${guideUsageCount(gift.id)} guides)`)
    .join(", ");

  console.warn(`[seo] ${flagged.length} guides need more distinctive picks: ${flagged.map((entry) => entry.slug).join(", ")}.`);
  console.warn(`[seo] Most reused guide products: ${topRepeatedProducts}.`);
}

function productUrl(gift) {
  return `${siteUrl}/gift/${gift.slug}/`;
}

function guideUrl(guide) {
  return `${siteUrl}/${guide.slug}/`;
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

function hotVideoForGift(gift) {
  const videos = Array.isArray(gift?.shortVideos) ? gift.shortVideos : [];

  return videos.find((video) => video?.provider === "tiktok" && video?.posterUrl) || videos.find((video) => video?.provider === "tiktok") || null;
}

function hotGiftThumbnailUrl(gift) {
  return hotVideoForGift(gift)?.posterUrl || primaryImageUrl(gift);
}

function hotGiftHasTikTokPoster(gift) {
  return Boolean(hotVideoForGift(gift)?.posterUrl);
}

function hotThumbUrl(story) {
  const items = hotStoryItems(story);
  const featuredGift = items.find((gift) => hotGiftHasTikTokPoster(gift)) || items[0];

  return featuredGift ? hotGiftThumbnailUrl(featuredGift) : `${siteUrl}/logo1.png`;
}

function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function buildBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href.startsWith("http") ? item.href : `${siteUrl}${item.href}`,
    })),
  };
}

function buildLinkedItemListSchema(name, url, links = []) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#list`,
    name,
    url,
    numberOfItems: links.length,
    itemListElement: links.map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: link.label,
      url: link.href.startsWith("http") ? link.href : `${siteUrl}${link.href}`,
    })),
  };
}

function attributionScriptTag() {
  return `<script defer src="/ai-attribution.js"></script>
  <script defer src="/affiliate-clicks.js"></script>`;
}

function socialImageMetaTags(imageUrl, altText) {
  return `<meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(altText)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(altText)}">`;
}

function renderFooterLinks({ includeLlms = false } = {}) {
  const links = [
    ["About", seoSite.aboutPath],
    ["Editorial", seoSite.editorialPath],
    ["Contact", seoSite.contactPath],
    ["Guides", "/guides/"],
    ["Hot", "/hot/"],
    ["Products", "/gift/"],
    ["Plans", "/dates/"],
    ["Site map", "/site-map.html"],
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
  const attrs = renderHtmlAttributes(buildAffiliateDataAttributes({
    gift,
    placement,
    merchant: merchantName(gift),
    linkType: commerceLinkType(gift),
  }));

  return `<a class="discovery-btn" href="${commerceUrl(gift)}" target="_blank" rel="${commerceRel(gift)}" ${attrs}>${escapeHtml(label)}</a>`;
}

function renderPaidLinkNote(gift) {
  return `<span class="discovery-paid-note">${escapeHtml(paidLinkNote(gift))}</span>`;
}

function renderEditorialSupportLinks() {
  return `<div class="discovery-editorial-links">
      <a class="discovery-editorial-link" href="${seoSite.editorialPath}">
        <span>Method</span>
        <strong>Read the editorial policy</strong>
      </a>
      <a class="discovery-editorial-link" href="${seoSite.aboutPath}">
        <span>About</span>
        <strong>See how the site is structured</strong>
      </a>
      <a class="discovery-editorial-link" href="${seoSite.contactPath}">
        <span>Corrections</span>
        <strong>Report a broken link or outdated page</strong>
      </a>
    </div>`;
}

function renderDiscoveryHeader(active = "", breadcrumbs = []) {
  const links = [
    { id: "guides", label: "Guides", href: "/guides/" },
    { id: "hot", label: "Hot", href: "/hot/" },
    { id: "products", label: "Products", href: "/gift/" },
    { id: "plans", label: "Plans", href: "/dates/" },
    { id: "site-map", label: "Site map", href: "/site-map.html" },
  ];

  return `<header class="discovery-header${breadcrumbs.length ? " has-breadcrumbs" : ""}">
      <div class="discovery-header-top">
        <a class="discovery-brand" href="/">
          <img src="/logo1.png" alt="ShopForHer">
        </a>
        <nav class="discovery-header-nav" aria-label="Discovery">
          ${links
            .map(
              (link) => `<a class="discovery-header-link${active === link.id ? " is-active" : ""}" href="${link.href}"${
                active === link.id ? ' aria-current="page"' : ""
              }>${escapeHtml(link.label)}</a>`
            )
            .join("")}
        </nav>
      </div>
      ${breadcrumbs.length ? renderBreadcrumbs(breadcrumbs, "is-inline") : ""}
    </header>`;
}

function renderBreadcrumbs(items = [], className = "") {
  if (!items.length) {
    return "";
  }

  return `<nav class="discovery-breadcrumbs${className ? ` ${className}` : ""}" aria-label="Breadcrumb">
      ${items
        .map((item, index) => {
          const content = item.href
            ? `<a href="${item.href}">${escapeHtml(item.label)}</a>`
            : `<span aria-current="page">${escapeHtml(item.label)}</span>`;
          const separator = index < items.length - 1 ? '<span class="discovery-breadcrumb-sep">/</span>' : "";

          return `${content}${separator}`;
        })
        .join("")}
    </nav>`;
}

function renderRailCard(card) {
  if (!card) {
    return "";
  }

  const links = (card.links || [])
    .map((link) => `<a class="discovery-rail-link" href="${link.href}">
          <strong>${escapeHtml(link.label)}</strong>
          ${link.meta ? `<span>${escapeHtml(link.meta)}</span>` : ""}
        </a>`)
    .join("");

  return `<section class="discovery-rail-card${card.emphasis ? " is-emphasis" : ""}">
      ${card.kicker ? `<p class="discovery-card-kicker">${escapeHtml(card.kicker)}</p>` : ""}
      ${card.title ? `<h2>${escapeHtml(card.title)}</h2>` : ""}
      ${card.body ? `<p>${escapeHtml(card.body)}</p>` : ""}
      ${
        (card.pills || []).length
          ? `<div class="discovery-pill-row discovery-pill-row-rail">
        ${card.pills.map((pill) => `<span>${escapeHtml(pill)}</span>`).join("")}
      </div>`
          : ""
      }
      ${links ? `<div class="discovery-rail-links">${links}</div>` : ""}
      ${card.cta || ""}
    </section>`;
}

function renderPageRail(cards = []) {
  const markup = cards.map((card) => renderRailCard(card)).filter(Boolean).join("");

  if (!markup) {
    return "";
  }

  return `<aside class="discovery-page-rail">${markup}</aside>`;
}

function renderTrustResourceLinks(note, excludeHrefs = []) {
  const excluded = new Set(excludeHrefs);
  const links = trustResourceLinks.filter((entry) => !excluded.has(entry.href));

  if (!links.length) {
    return "";
  }

  return `${note ? `<p class="discovery-section-note">${escapeHtml(note)}</p>` : ""}
        <div class="discovery-related">
          ${links
            .map(
              (entry) => `<a class="discovery-related-link" href="${entry.href}">
            <span>${escapeHtml(entry.meta)}</span>
            <strong>${escapeHtml(entry.label)}</strong>
          </a>`
            )
            .join("")}
        </div>`;
}

function pageTrustSchemaFields() {
  return {
    isAccessibleForFree: true,
    publishingPrinciples: editorialPolicyUrl,
  };
}

function renderDiscoveryFooter({ notes = [], includeLlms = false, includeAffiliateDisclosure = false } = {}) {
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

  return `<section class="discovery-section" id="guide-editorial">
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
        ${renderTrustResourceLinks("Use these pages when you want to verify the site methodology, understand who writes the pages, or flag a correction.")}
      </section>`;
}

function renderGuideComparisonSection(guide, items = guideItems(guide)) {
  const overlap = guideOverlapDetails(guide, items);

  if (!overlap.distinctiveItems.length) {
    return "";
  }

  const relatedSummary = overlap.relatedOverlap.slice(0, 2).map((entry) => entry.label).join(" and ");
  const distinctiveSummary = overlap.distinctiveItems.map((gift) => gift.name).join(", ");
  const baseUseCase = guide.bestUseCase || "Use this page when the title closely matches the relationship stage, budget, or occasion you are buying for.";
  const note = relatedSummary
    ? `Compared with ${relatedSummary}, this page answers a narrower buying moment. ${baseUseCase} Less-repeated picks here include ${distinctiveSummary}.`
    : `${baseUseCase} Less-repeated picks here include ${distinctiveSummary}.`;

  return `<section class="discovery-section" id="guide-differentiation">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Differentiation</p>
          <h2>How this page differs</h2>
        </div>
        <p class="discovery-section-note">${escapeHtml(note)}</p>
        <div class="discovery-decision-grid">
          <article class="discovery-decision-card">
            <span class="discovery-decision-label">Use this page when</span>
            <h3>${escapeHtml(guide.label)}</h3>
            <p>${escapeHtml(guide.bestUseCase || "The page title closely matches the moment you are buying for.")}</p>
          </article>
          <article class="discovery-decision-card">
            <span class="discovery-decision-label">Use another page when</span>
            <h3>${escapeHtml(guide.related?.length ? "A nearby guide fits better" : "The moment changed")}</h3>
            <p>${escapeHtml(guide.avoidWhen || "Another guide on the site matches the budget, relationship stage, or intent more directly.")}</p>
          </article>
          ${overlap.distinctiveItems
            .map(
              (gift) => `<article class="discovery-decision-card">
            <span class="discovery-decision-label">Distinctive pick</span>
            <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
            <p>${escapeHtml(gift.why)}</p>
            <p class="discovery-best-for">Appears in ${guideUsageCount(gift.id)} guide${guideUsageCount(gift.id) === 1 ? "" : "s"}.</p>
          </article>`
            )
            .join("")}
        </div>
      </section>`;
}

function renderGuideExpansionSection(guide, expansionProducts = []) {
  if (!expansionProducts.length) {
    return "";
  }

  return `<section class="discovery-section" id="guide-expansion">
        <div class="discovery-section-head">
          <p class="discovery-kicker">More specific picks</p>
          <h2>Less-repeated products that still fit</h2>
        </div>
        <p class="discovery-section-note">${escapeHtml(`These are lower-reuse product pages that still match ${guide.label.toLowerCase()} when you want a more specific answer than the main shortlist.`)}</p>
        <div class="discovery-decision-grid">
          ${expansionProducts
            .map((gift) => {
              const usageCount = guideUsageCount(gift.id);

              return `<article class="discovery-decision-card">
            <span class="discovery-decision-label">Specific lane</span>
            <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
            <p>${escapeHtml(gift.why)}</p>
            <p class="discovery-best-for">Best for: ${escapeHtml(gift.bestFor)}. Used on ${usageCount} other guide${usageCount === 1 ? "" : "s"}.</p>
          </article>`;
            })
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
        : usesDirectMerchantPath(gift)
          ? `This page links directly to the ${merchantName(gift)} product page and checkout still happens off-site.`
          : "This page links out to a stable merchant listing and all checkout still happens off-site.",
    ],
    ["Pricing note", priceEstimateNote],
  ];

  return `<section class="discovery-section" id="product-editorial">
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
        ${renderTrustResourceLinks("Read the methodology, team context, or contact page if you want to validate why this product stayed on the site.")}
      </section>`;
}

function productComparisonLabel(source, candidate) {
  const sourcePrice = priceMidpoint(source);
  const candidatePrice = priceMidpoint(candidate);

  if (Number.isFinite(sourcePrice) && Number.isFinite(candidatePrice)) {
    if (candidatePrice <= sourcePrice - 25) {
      return "Switch for lower spend";
    }

    if (candidatePrice >= sourcePrice + 25) {
      return "Switch for premium spend";
    }
  }

  if (source.badge && candidate.badge && source.badge !== candidate.badge) {
    return `Switch for the ${candidate.badge.toLowerCase()} lane`;
  }

  if (source.vibe && candidate.vibe && source.vibe !== candidate.vibe) {
    return `Switch for the ${candidate.vibe.toLowerCase()} mood`;
  }

  return "Switch for a different fit";
}

function comparisonReasonText(source, candidate) {
  const sourcePrice = priceMidpoint(source);
  const candidatePrice = priceMidpoint(candidate);

  if (Number.isFinite(sourcePrice) && Number.isFinite(candidatePrice)) {
    if (candidatePrice <= sourcePrice - 25) {
      return `${candidate.name} is the better move when you want a similar lane with less spend and do not need the broadest safest answer first.`;
    }

    if (candidatePrice >= sourcePrice + 25) {
      return `${candidate.name} is the better move when you are willing to spend more for a narrower upgrade than ${source.name}.`;
    }
  }

  if (source.badge && candidate.badge && source.badge !== candidate.badge) {
    return `${candidate.name} is the better move when the ${candidate.badge.toLowerCase()} read matters more than the broadest safe answer on the page.`;
  }

  if (source.vibe && candidate.vibe && source.vibe !== candidate.vibe) {
    return `${candidate.name} is the better move when you want a ${candidate.vibe.toLowerCase()} mood instead of ${source.vibe.toLowerCase()}.`;
  }

  if (source.bestFor && candidate.bestFor && source.bestFor !== candidate.bestFor) {
    return `${candidate.name} is the better move when ${candidate.bestFor} is a closer buyer moment than ${source.bestFor}.`;
  }

  return `${candidate.name} is the better move when its fit is closer to the buyer moment than the broadest first answer.`;
}

function guideChoiceLabel(source, candidate, index) {
  if (index === 0) {
    return "Safest first answer";
  }

  return productComparisonLabel(source, candidate).replace(/^Switch/, "Choose this");
}

function renderGuideTopChoicesSection(guide, items = guideItems(guide)) {
  const comparisonItems = items.slice(0, 3);
  const leadGift = comparisonItems[0] || null;

  if (!leadGift || comparisonItems.length < 2) {
    return "";
  }

  return `<section class="discovery-section" id="guide-top-compare">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Decision</p>
          <h2>How to choose between the top picks</h2>
        </div>
        <p class="discovery-section-note">${escapeHtml(`Use this fast compare when ${guide.label.toLowerCase()} is the right page but you still need to decide between the strongest options.`)}</p>
        <div class="discovery-decision-grid">
          ${comparisonItems
            .map((gift, index) => {
              const usageCount = guideUsageCount(gift.id);
              const summary = index === 0 ? gift.why : comparisonReasonText(leadGift, gift);

              return `<article class="discovery-decision-card">
            <span class="discovery-decision-label">${escapeHtml(guideChoiceLabel(leadGift, gift, index))}</span>
            <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
            <p>${escapeHtml(summary)}</p>
            <p class="discovery-best-for">Best for: ${escapeHtml(gift.bestFor)}. ${escapeHtml(gift.priceLabel)}. Used on ${usageCount} guide${usageCount === 1 ? "" : "s"}.</p>
          </article>`;
            })
            .join("")}
        </div>
      </section>`;
}

function renderProductComparisonSection(gift, relatedProducts = []) {
  const comparisonProducts = relatedProducts.slice(0, 3);

  if (!comparisonProducts.length) {
    return "";
  }

  const stayNote = usesAffiliateSearchFallback(gift)
    ? `Stay with ${gift.name} when the product lane is right and you do not mind using the Amazon search path to reach the current listing.`
    : usesDirectMerchantPath(gift)
      ? `Stay with ${gift.name} when ${merchantName(gift)} is the merchant you already trust and ${gift.bestFor} is the exact fit.`
      : `Stay with ${gift.name} when ${gift.bestFor} is the exact fit and you want the cleanest version of this lane.`;

  return `<section class="discovery-section" id="product-compare">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Comparison</p>
          <h2>Compare this pick with nearby options</h2>
        </div>
        <p class="discovery-section-note">Use this section when the product lane is right but you want to trade price band, mood, or use case before checkout.</p>
        <div class="discovery-decision-grid">
          <article class="discovery-decision-card">
            <span class="discovery-decision-label">Stay with this pick</span>
            <h3>${escapeHtml(gift.name)}</h3>
            <p>${escapeHtml(stayNote)}</p>
            <p class="discovery-best-for">Best for: ${escapeHtml(gift.bestFor)}. ${escapeHtml(gift.priceLabel)}.</p>
          </article>
          ${comparisonProducts
            .map((entry) => {
              const sharedGuideCount = countSharedGuides(gift.id, entry.id);
              const guideNote = sharedGuideCount
                ? `Shared with this pick in ${sharedGuideCount} guide${sharedGuideCount === 1 ? "" : "s"}.`
                : "This is a nearby alternative in the same general product lane.";

              return `<article class="discovery-decision-card">
            <span class="discovery-decision-label">${escapeHtml(productComparisonLabel(gift, entry))}</span>
            <h3><a class="discovery-title-link" href="/gift/${entry.slug}/">${escapeHtml(entry.name)}</a></h3>
            <p>${escapeHtml(comparisonReasonText(gift, entry))}</p>
            <p class="discovery-best-for">Best for: ${escapeHtml(entry.bestFor)}. ${escapeHtml(entry.priceLabel)}. ${escapeHtml(guideNote)}</p>
          </article>`;
            })
            .join("")}
        </div>
      </section>`;
}

function renderGuideSignalsSection(guide) {
  if (!guide.buyerSignals?.length) {
    return "";
  }

  return `<section class="discovery-section" id="guide-buyer-read">
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

  return `<section class="discovery-section" id="guide-best-fits">
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

  return `<section class="discovery-section" id="guide-avoid">
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

  return `<section class="discovery-section" id="guide-pick-lanes">
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

function renderGuideOverviewSection(guide, items) {
  const featuredGift = items[0] || null;
  const firstClickBody = featuredGift
    ? `${featuredGift.name} is the fastest first click on this page when you want the cleanest answer without overthinking it. ${featuredGift.why}`
    : "Start with the first ranked pick on this page when the title matches the exact buyer moment you are trying to solve.";

  return `<section class="discovery-section" id="guide-overview">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Start here</p>
          <h2>How to use this page</h2>
        </div>
        <div class="discovery-faqs">
          <article class="discovery-faq">
            <h3>Best first click</h3>
            <p>${escapeHtml(firstClickBody)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Use this page when</h3>
            <p>${escapeHtml(guide.bestUseCase || "Use this page when the page title closely matches the occasion, budget, or relationship stage you are buying for.")}</p>
          </article>
          <article class="discovery-faq">
            <h3>Skip this page when</h3>
            <p>${escapeHtml(guide.avoidWhen || "Skip this page when a narrower page on the site matches your moment, budget, or relationship stage more directly.")}</p>
          </article>
        </div>
      </section>`;
}

function renderProductContextSection(gift, matchingGuides) {
  const leadGuide = matchingGuides[0] || null;
  const merchantPathNote = usesAffiliateSearchFallback(gift)
    ? "This page currently uses an Amazon search path because a pinned direct merchant listing is not yet stored in the catalog."
    : usesDirectMerchantPath(gift)
      ? `Checkout opens on the ${merchantName(gift)} product page and final pricing is confirmed there on the merchant site.`
      : `Checkout opens on ${merchantName(gift)} and final pricing is confirmed there on the merchant site.`;
  const guideFitNote = leadGuide
    ? `${gift.name} appears in ${matchingGuides.length} guide${matchingGuides.length === 1 ? "" : "s"} on ShopForHer. Start with ${leadGuide.label.toLowerCase()} when you want the surrounding buyer context before you buy.`
    : `${gift.name} currently stands on its own product page, so this page is the fastest way to understand why it is on the site.`;

  return `<section class="discovery-section" id="product-context">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Context</p>
          <h2>Where this product fits</h2>
        </div>
        <div class="discovery-faqs">
          <article class="discovery-faq">
            <h3>Best buyer moment</h3>
            <p>${escapeHtml(`Use ${gift.name} when the buyer moment matches ${gift.bestFor} and you want something that feels ${gift.badge} without needing extra explanation.`)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Why it reads as a gift</h3>
            <p>${escapeHtml(`${gift.hook} ${gift.why}`)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Where it shows up on the site</h3>
            <p>${escapeHtml(guideFitNote)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Buying note</h3>
            <p>${escapeHtml(`${merchantPathNote} ${priceEstimateNote}`)}</p>
          </article>
        </div>
      </section>`;
}

function renderHotStoryAngleSection(story, items, relatedGuides) {
  const leadGift = items[0] || null;
  const leadGuide = relatedGuides[0] || null;
  const trendRead = leadGift
    ? `${story.description} ${leadGift.name} is a clean example of the lane: ${leadGift.hook} ${leadGift.why}`
    : story.description;
  const firstClick = leadGift
    ? `${leadGift.name} is the first product to open if you want the quickest read on this trend. ${leadGift.hook}`
    : "Start with the first ranked product in the story list when you want the fastest answer.";
  const useLane = leadGuide
    ? `Use this story when you want a current-feeling answer fast and do not need the broadest evergreen guide first. If you want more context before buying, move next to ${leadGuide.label.toLowerCase()}.`
    : "Use this story when you want a current-feeling answer fast and do not need the broadest evergreen guide first.";

  return `<section class="discovery-section" id="story-angle">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Read the lane</p>
          <h2>Why this story is moving</h2>
        </div>
        <div class="discovery-faqs">
          <article class="discovery-faq">
            <h3>What is actually trending</h3>
            <p>${escapeHtml(trendRead)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Best first click</h3>
            <p>${escapeHtml(firstClick)}</p>
          </article>
          <article class="discovery-faq">
            <h3>When to use this page</h3>
            <p>${escapeHtml(useLane)}</p>
          </article>
        </div>
      </section>`;
}

function renderHotStoryEditorialSection(story, relatedGuides) {
  const leadGuide = relatedGuides[0] || null;
  const skipLaneCopy = leadGuide
    ? `Skip the viral lane when you need slower-moving evergreen coverage, a tighter budget read, or a clearer relationship-stage filter. ${leadGuide.label} is the better next move.`
    : "Skip the viral lane when you need slower-moving evergreen coverage, a tighter budget read, or a clearer relationship-stage filter.";

  return `<section class="discovery-section" id="story-editorial">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Editorial</p>
          <h2>How this story was built</h2>
        </div>
        <div class="discovery-faqs">
          <article class="discovery-faq">
            <h3>Written by</h3>
            <p>${escapeHtml(`${editorialAuthor.name} · ${editorialAuthor.title}`)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Reviewed by</h3>
            <p>${escapeHtml(`${editorialReviewer.name} · ${editorialReviewer.title}`)}</p>
          </article>
          <article class="discovery-faq">
            <h3>How the page is structured</h3>
            <p>${escapeHtml("Hot pages combine an editor-tracked current-interest angle, a short ranked product list, and related evergreen guides so the page can move fast without losing context.")}</p>
          </article>
          <article class="discovery-faq">
            <h3>When to skip this lane</h3>
            <p>${escapeHtml(skipLaneCopy)}</p>
          </article>
          <article class="discovery-faq">
            <h3>Pricing note</h3>
            <p>${escapeHtml(priceEstimateNote)}</p>
          </article>
        </div>
        ${renderTrustResourceLinks("These pages are current-interest editorial reads, not sourced social analytics snapshots. Use the trust pages when you want to verify how the page was built or report something that looks stale.")}
      </section>`;
}

function guideFaqs(guide, items) {
  if (guide.faqs?.length) {
    return guide.faqs;
  }

  const leadGift = items[0] || null;
  const alternateGift = items[1] || null;
  const relatedGuide = guide.related.map((slug) => guideBySlug.get(slug)).filter(Boolean).filter(isIndexableGuidePage)[0] || null;

  return [
    {
      q: `What is the safest pick on this ${guide.label.toLowerCase()} page?`,
      a: leadGift
        ? `${leadGift.name} is the cleanest first answer here. ${leadGift.why}`
        : "Start with the first ranked pick.",
    },
    {
      q: "How do I choose between the top picks on this page?",
      a: leadGift && alternateGift
        ? `${leadGift.name} is the safest overall answer. ${comparisonReasonText(leadGift, alternateGift)} If that still feels close rather than exact, compare the rest of the shortlist before buying.`
        : "Start with the first ranked pick, then compare the shortlist if you want a narrower fit or lower-risk alternative.",
    },
    {
      q: "Should I use this page or another guide first?",
      a: relatedGuide
        ? `${guide.bestUseCase || "Stay on this page when the title matches the exact moment you are buying for."} Use ${relatedGuide.label.toLowerCase()} first when that page describes the buyer moment more directly than this one.`
        : `${guide.bestUseCase || "Stay on this page when the title matches the exact moment you are buying for."} Move to another guide only when the budget, relationship stage, or occasion changes.`,
    },
  ];
}

function productFaqs(gift, matchingGuides) {
  const leadGuide = matchingGuides[0] || null;
  const buyNote = usesAffiliateSearchFallback(gift)
    ? "This page currently uses an Amazon search link so you can find the latest listing, then finish checkout on the merchant site."
    : usesDirectMerchantPath(gift)
      ? `This page links directly to the ${merchantName(gift)} product page and checkout still happens on the merchant site.`
      : `This page links out to the ${merchantName(gift)} listing and checkout still happens on the merchant site.`;

  return [
    {
      q: `What kind of gift is ${gift.name}?`,
      a: `${gift.name} is a ${gift.badge} pick that works best for ${gift.bestFor}. ${gift.why}`,
    },
    {
      q: `When should I choose ${gift.name}?`,
      a: leadGuide
        ? `${gift.hook} It is strongest when the buyer moment matches ${gift.bestFor} and you want the kind of answer that already fits on ${leadGuide.label.toLowerCase()}.`
        : `${gift.hook} Use it when the buyer moment matches ${gift.bestFor} and you want a cleaner product-level answer fast.`,
    },
    {
      q: `Where do I buy ${gift.name}?`,
      a: `${buyNote} ${priceEstimateNote}`,
    },
  ];
}

function hotStoryFaqs(story, items, relatedGuides) {
  const leadGift = items[0] || null;
  const leadGuide = relatedGuides[0] || null;

  return [
    {
      q: "What is the safest first click in this story?",
      a: leadGift
        ? `${leadGift.name} is the cleanest first click here. ${leadGift.why}`
        : "Start with the first ranked product in the story list.",
    },
    {
      q: "Who is this story really for?",
      a: `${story.intro} This page is best when you want a current-feeling answer quickly instead of starting with the broadest evergreen guide.`,
    },
    {
      q: "Should I use this story or a guide first?",
      a: leadGuide
        ? `Use this story first when speed and current attention matter more than full coverage. Use ${leadGuide.label.toLowerCase()} first when you want the broader evergreen shortlist before buying.`
        : "Use this story first when speed and current attention matter more than full evergreen coverage.",
    },
  ];
}

function hotStoryCardChips(story) {
  return [
    "Editor tracked",
    story.itemIds?.length ? `${story.itemIds.length} pick${story.itemIds.length === 1 ? "" : "s"}` : null,
    story.relatedGuides?.length ? `${story.relatedGuides.length} guide${story.relatedGuides.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
}

function hotStoryPagePills(story, items, relatedGuides) {
  return [
    story.trendLabel,
    items.length ? `${items.length} pick${items.length === 1 ? "" : "s"}` : null,
    relatedGuides.length ? `${relatedGuides.length} guide${relatedGuides.length === 1 ? "" : "s"}` : "Editor tracked",
  ].filter(Boolean);
}

function renderFaqSection(sectionId, title, faqs) {
  if (!faqs?.length) {
    return "";
  }

  return `<section class="discovery-section" id="${escapeHtml(sectionId)}">
        <div class="discovery-section-head">
          <p class="discovery-kicker">FAQ</p>
          <h2>${escapeHtml(title)}</h2>
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
      </section>`;
}

function renderGuidePage(guide, freshness = lastmodPlaceholder) {
  const items = guideItems(guide);
  const featuredGift = items[0] || null;
  const shortlist = items.length > 1 ? items.slice(1) : [];
  const related = guide.related.map((slug) => guideBySlug.get(slug)).filter(Boolean).filter(isIndexableGuidePage);
  const relatedHotStories = hotStoriesForGuide(guide, items);
  const expansionProducts = guideExpansionProducts(guide, items);
  const canonical = `${siteUrl}/${guide.slug}/`;
  const pageTitle = guide.title;
  const faqs = guideFaqs(guide, items);
  const pageImage = guideImageUrl(guide);
  const pageImageAlt = featuredGift ? `${guide.h1} featuring ${featuredGift.name}` : guide.h1;
  const topChoicesSection = renderGuideTopChoicesSection(guide, items);
  const comparisonSection = renderGuideComparisonSection(guide, items);
  const guideSectionLinks = [
    { href: "#guide-overview", label: "How to use this page", meta: "Start here" },
    ...(topChoicesSection ? [{ href: "#guide-top-compare", label: "Compare top picks", meta: "Fast decision" }] : []),
    ...(shortlist.length ? [{ href: "#guide-shortlist", label: "Shortlist", meta: `${shortlist.length} more picks` }] : []),
    ...(comparisonSection ? [{ href: "#guide-differentiation", label: "How this page differs", meta: "Comparison read" }] : []),
    ...(expansionProducts.length ? [{ href: "#guide-expansion", label: "Less-repeated fits", meta: `${expansionProducts.length} more picks` }] : []),
    ...(guide.pickLanes?.length ? [{ href: "#guide-pick-lanes", label: "Best pick by lane", meta: "Short answer" }] : []),
    ...(guide.bestFits?.length ? [{ href: "#guide-best-fits", label: "Best if she likes...", meta: "Decision guide" }] : []),
    ...(guide.buyerSignals?.length ? [{ href: "#guide-buyer-read", label: "Buyer read", meta: "What usually works" }] : []),
    ...(guide.avoidNotes?.length ? [{ href: "#guide-avoid", label: "What to avoid", meta: "Skip these moves" }] : []),
    { href: "#guide-editorial", label: "Editorial notes", meta: "How we picked" },
    { href: "#guide-faq", label: "Quick answers", meta: `${faqs.length} FAQ${faqs.length === 1 ? "" : "s"}` },
    ...(relatedHotStories.length ? [{ href: "#guide-hot", label: "Hot pages using these picks", meta: `${relatedHotStories.length} trending page${relatedHotStories.length === 1 ? "" : "s"}` }] : []),
    ...(related.length ? [{ href: "#guide-related", label: "Related guides", meta: `${related.length} more pages` }] : []),
  ];
  const guideRail = renderPageRail([
    {
      kicker: "Page snapshot",
      title: guide.label,
      body: guide.bestUseCase || guide.description,
      pills: [`Updated ${freshness.displayDate}`, `${items.length} picks`, featuredGift ? featuredGift.priceLabel : ""].filter(Boolean),
      emphasis: true,
      cta: featuredGift
        ? `<div class="discovery-actions discovery-actions-rail">
        <a class="discovery-text-link" href="/gift/${featuredGift.slug}/">Open top pick</a>
        ${renderAffiliateAnchor(featuredGift, `guide-${guide.slug}-rail`, "Buy first pick")}
      </div>
      ${renderPaidLinkNote(featuredGift)}`
        : "",
    },
    {
      kicker: "On this page",
      title: "Jump to a section",
      links: guideSectionLinks,
    },
    relatedHotStories.length
      ? {
          kicker: "Hot",
          title: "Trending pages using these picks",
          body: "Open a hot page when you want the same product lane in a more current, faster-moving context.",
          links: relatedHotStories.slice(0, 4).map(({ story, sharedCount }) => ({
            href: `/hot/${story.slug}/`,
            label: story.h1,
            meta: `${story.trendLabel} · ${sharedCount} shared pick${sharedCount === 1 ? "" : "s"}`,
          })),
        }
      : null,
    related.length
      ? {
          kicker: "Keep browsing",
          title: "Related guides",
          body: "Move into a narrower angle if this page is close but not exact.",
          links: related.slice(0, 4).map((entry) => ({
            href: `/${entry.slug}/`,
            label: entry.label,
            meta: entry.groupLabel,
          })),
        }
      : null,
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#items`,
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
    inLanguage: "en-US",
    dateModified: freshness.isoDate,
    mainEntityOfPage: canonical,
    mainEntity: {
      "@id": `${canonical}#items`,
    },
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
    mentions: items.slice(0, 6).map((gift) => ({
      "@type": "Product",
      name: gift.name,
      url: productUrl(gift),
    })),
    keywords: [guide.label, guide.groupLabel, "gifts for her", "gift guide"].join(", "),
    ...pageTrustSchemaFields(),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(guide.description)}">
  <meta name="robots" content="${guideRobotsContent(guide)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(guide.description)}">
  <meta property="og:url" content="${canonical}">
  ${socialImageMetaTags(pageImage, pageImageAlt)}
  <meta property="article:section" content="${escapeHtml(guide.groupLabel)}">
  <meta property="article:tag" content="${escapeHtml(guide.label)}">
  <meta property="article:modified_time" content="${escapeHtml(freshness.dateTime)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(guide.description)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${attributionScriptTag()}
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
  ${jsonLdScript(faqSchema)}
</head>
<body>
  <div class="discovery-shell discovery-shell-guide">
    ${renderDiscoveryHeader("guides", [
      { label: "Home", href: "/" },
      { label: "Guides", href: "/guides/" },
      { label: guide.h1 },
    ])}
    <main class="discovery-main discovery-main-guide">
      <section class="discovery-hero discovery-hero-guide">
        <div class="discovery-hero-layout">
          <div class="discovery-hero-copy">
            <p class="discovery-kicker">${escapeHtml(guide.groupLabel)}</p>
            <h1>${escapeHtml(guide.h1)}</h1>
            <p class="discovery-intro">${escapeHtml(guide.intro)}</p>
            <div class="discovery-meta">
              <span>Updated ${escapeHtml(freshness.displayDate)}</span>
              <span>${items.length} picks</span>
              <span>Off-site merchant checkout</span>
            </div>
          </div>
          ${
            featuredGift
              ? `<aside class="discovery-hero-feature">
            <a class="discovery-hero-feature-media" href="/gift/${featuredGift.slug}/">
              <img src="${escapeHtml(primaryImageUrl(featuredGift))}" alt="${escapeHtml(featuredGift.name)}">
            </a>
            <div class="discovery-hero-feature-body">
              <span class="discovery-card-kicker">Best first pick</span>
              <h2><a class="discovery-title-link" href="/gift/${featuredGift.slug}/">${escapeHtml(featuredGift.name)}</a></h2>
              <p class="discovery-feature-copy">${escapeHtml(featuredGift.hook)} ${escapeHtml(featuredGift.why)}</p>
              <div class="discovery-pill-row">
                <span>${escapeHtml(featuredGift.priceLabel)}</span>
                <span>${escapeHtml(featuredGift.badge)}</span>
                <span>Best for ${escapeHtml(featuredGift.bestFor)}</span>
              </div>
              <div class="discovery-actions">
                <a class="discovery-text-link" href="/gift/${featuredGift.slug}/">Open product page</a>
                ${renderAffiliateAnchor(featuredGift, `guide-${guide.slug}-hero`, "Buy now")}
                ${renderPaidLinkNote(featuredGift)}
              </div>
            </div>
          </aside>`
              : ""
          }
        </div>
      </section>
      <div class="discovery-page-main">
        <div class="discovery-page-stack">
          ${renderGuideOverviewSection(guide, items)}
          ${topChoicesSection}
          ${
            shortlist.length
              ? `<section class="discovery-section" id="guide-shortlist">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Shortlist</p>
          <h2>More clean options</h2>
        </div>
        <p class="discovery-section-note">Use these when the first answer is close but not final.</p>
        <ol class="discovery-guide-list">
          ${shortlist
            .map(
              (gift, index) => `<li class="discovery-guide-item">
            <a class="discovery-guide-item-media" href="/gift/${gift.slug}/">
              <img src="${escapeHtml(primaryImageUrl(gift))}" alt="${escapeHtml(gift.name)}">
            </a>
            <div class="discovery-guide-item-body">
              <div class="discovery-guide-item-head">
                <span class="discovery-rank">${String(index + 2).padStart(2, "0")}</span>
                <div>
                  <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
                  <div class="discovery-pill-row is-inline">
                    <span>${escapeHtml(gift.priceLabel)}</span>
                    <span>${escapeHtml(gift.badge)}</span>
                  </div>
                </div>
              </div>
              <p class="discovery-copy">${escapeHtml(gift.hook)} ${escapeHtml(gift.why)}</p>
              <p class="discovery-best-for">Best for: ${escapeHtml(gift.bestFor)}</p>
              <div class="discovery-actions">
                <a class="discovery-text-link" href="/gift/${gift.slug}/">View product</a>
                ${renderAffiliateAnchor(gift, `guide-${guide.slug}-list`)}
                ${renderPaidLinkNote(gift)}
              </div>
            </div>
          </li>`
            )
            .join("")}
        </ol>
      </section>`
              : ""
          }

          ${comparisonSection}
          ${renderGuideExpansionSection(guide, expansionProducts)}
          ${renderGuidePickLanesSection(guide)}
          ${renderGuideBestFitsSection(guide)}
          ${renderGuideSignalsSection(guide)}
          ${renderGuideAvoidSection(guide)}
          ${renderGuideMethodSection(guide)}

          <section class="discovery-section" id="guide-faq">
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

          ${
            relatedHotStories.length
              ? `<section class="discovery-section" id="guide-hot">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Hot</p>
          <h2>Trending pages using these picks</h2>
        </div>
        <p class="discovery-section-note">Use a hot page first when you want the faster trend angle around the same gift lane.</p>
        <div class="discovery-related">
          ${relatedHotStories
            .map(
              ({ story, sharedCount, sharedItems }) => `<a class="discovery-related-link" href="/hot/${story.slug}/">
            <span>${escapeHtml(`${story.trendLabel} · ${sharedCount} shared pick${sharedCount === 1 ? "" : "s"}`)}</span>
            <strong>${escapeHtml(story.h1)}</strong>
            <small>${escapeHtml(sharedItems.slice(0, 2).map((gift) => gift.name).join(", "))}</small>
          </a>`
            )
            .join("")}
        </div>
      </section>`
              : ""
          }

          ${
            related.length
              ? `<section class="discovery-section" id="guide-related">
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
          </section>`
              : ""
          }
        </div>
        ${guideRail}
      </div>
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

function renderProductPage(gift, freshness = lastmodPlaceholder) {
  const matchingGuides = indexableSeoGuides.filter((guide) => guide.itemIds.includes(gift.id)).slice(0, 6);
  const matchingHotStories = hotStoriesForGift(gift).slice(0, 6);
  const relatedProducts = relatedProductsForGift(gift);
  const canonical = productUrl(gift);
  const pageTitle = `${gift.name} | ShopForHer`;
  const description = `${gift.name} is a ${gift.badge} pick on ShopForHer. ${gift.why}`;
  const images = productImages(gift);
  const primaryImage = primaryImageUrl(gift);
  const pageImageAlt = `${gift.name} product image`;
  const offerSchema = productOfferSchema(gift);
  const productSchemaId = `${canonical}#product`;
  const faqs = productFaqs(gift, matchingGuides);
  const productSectionLinks = [
    { href: "#product-spotlight", label: "Product spotlight", meta: "Images and notes" },
    { href: "#product-context", label: "Where it fits", meta: "Buyer context" },
    ...(relatedProducts.length ? [{ href: "#product-compare", label: "Compare nearby picks", meta: `${Math.min(3, relatedProducts.length)} options` }] : []),
    ...(matchingGuides.length ? [{ href: "#product-guides", label: "Guides using this pick", meta: `${matchingGuides.length} guide${matchingGuides.length === 1 ? "" : "s"}` }] : []),
    ...(matchingHotStories.length ? [{ href: "#product-hot", label: "Hot stories using this pick", meta: `${matchingHotStories.length} story${matchingHotStories.length === 1 ? "" : "s"}` }] : []),
    { href: "#product-related", label: "Related products", meta: `${relatedProducts.length} more picks` },
    { href: "#product-faq", label: "Quick answers", meta: `${faqs.length} FAQ${faqs.length === 1 ? "" : "s"}` },
    { href: "#product-editorial", label: "Editorial notes", meta: "How it was reviewed" },
  ];
  const productRail = renderPageRail([
    {
      kicker: "Product snapshot",
      title: gift.name,
      body: gift.hook,
      pills: [gift.priceLabel, gift.badge, `${merchantName(gift)} checkout`],
      emphasis: true,
      cta: `<div class="discovery-actions discovery-actions-rail">
        ${renderAffiliateAnchor(gift, `product-${gift.slug}-rail`, "Buy now")}
        ${
          matchingGuides[0]
            ? `<a class="discovery-text-link" href="/${matchingGuides[0].slug}/">Open best matching guide</a>`
            : ""
        }
      </div>
      ${renderPaidLinkNote(gift)}`,
    },
    {
      kicker: "On this page",
      title: "Jump to a section",
      links: productSectionLinks,
    },
    matchingHotStories.length
      ? {
          kicker: "Hot",
          title: "Hot stories using this pick",
          body: "Move into a trend page first if you want the social or seasonal angle before you buy.",
          links: matchingHotStories.slice(0, 4).map((story) => ({
            href: `/hot/${story.slug}/`,
            label: story.h1,
            meta: story.trendLabel,
          })),
        }
      : null,
    matchingGuides.length
      ? {
          kicker: "Featured in",
          title: "Guides using this pick",
          body: "Open the guide context first if you want to compare this item against nearby alternatives.",
          links: matchingGuides.slice(0, 4).map((guide) => ({
            href: `/${guide.slug}/`,
            label: guide.label,
            meta: guide.groupLabel,
          })),
        }
      : {
          kicker: "Keep browsing",
          title: "Related products",
          body: "Stay in the same lane if you want a similar price band or buying signal before checkout.",
          links: relatedProducts.slice(0, 4).map((entry) => ({
            href: `/gift/${entry.slug}/`,
            label: entry.name,
            meta: entry.badge,
          })),
        },
  ]);
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
    ...(relatedProducts.length
      ? {
          isSimilarTo: relatedProducts.slice(0, 3).map((entry) => ({
            "@type": "Product",
            name: entry.name,
            url: productUrl(entry),
          })),
        }
      : {}),
  };

  const productPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description,
    url: canonical,
    inLanguage: "en-US",
    dateModified: freshness.isoDate,
    mainEntityOfPage: canonical,
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
    ...pageTrustSchemaFields(),
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
        name: "Products",
        item: `${siteUrl}/gift/`,
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
  <meta name="robots" content="${productRobotsContent(gift)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  ${socialImageMetaTags(primaryImage, pageImageAlt)}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${attributionScriptTag()}
  ${jsonLdScript(productSchema)}
  ${jsonLdScript(productPageSchema)}
  ${jsonLdScript(faqSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell discovery-shell-product">
    ${renderDiscoveryHeader("products", [
      { label: "Home", href: "/" },
      { label: "Products", href: "/gift/" },
      { label: gift.name },
    ])}
    <main class="discovery-main discovery-main-product">
      <section class="discovery-hero discovery-hero-product">
        <div class="discovery-hero-layout">
          <div class="discovery-hero-copy">
            <p class="discovery-kicker">Product</p>
            <h1>${escapeHtml(gift.name)}</h1>
            <p class="discovery-intro">${escapeHtml(gift.hook)} ${escapeHtml(gift.why)}</p>
            <div class="discovery-meta">
              <span>${escapeHtml(gift.priceLabel)}</span>
              <span>${escapeHtml(gift.badge)}</span>
              <span>Updated ${escapeHtml(freshness.displayDate)}</span>
              <span>Off-site merchant checkout</span>
            </div>
          </div>
          <aside class="discovery-product-glance">
            <span class="discovery-card-kicker">Quick read</span>
            <strong>${escapeHtml(gift.badge)}</strong>
            <p>${escapeHtml(gift.why)}</p>
            <div class="discovery-pill-row">
              <span>${escapeHtml(gift.priceLabel)}</span>
              <span>${escapeHtml(merchantName(gift))} checkout</span>
              <span>${matchingGuides.length ? `${matchingGuides.length} guides use this` : "Direct product page"}</span>
            </div>
          </aside>
        </div>
      </section>
      <div class="discovery-page-main">
        <div class="discovery-page-stack">
          <section class="discovery-product-spotlight" id="product-spotlight">
        <div class="discovery-product-media">
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
        </div>
        <aside class="discovery-product-panel">
          <div class="discovery-product-badge-row">
            <span>${escapeHtml(gift.priceLabel)}</span>
            <span>${escapeHtml(gift.badge)}</span>
            <span>${escapeHtml(merchantName(gift))} checkout</span>
          </div>
          <div class="discovery-product-summary">
            <span class="discovery-product-eyebrow">Why this one works</span>
            <p>${escapeHtml(gift.why)}</p>
          </div>
          <div class="discovery-product-facts">
            <article class="discovery-product-point">
              <span>Price</span>
              <strong>${escapeHtml(gift.priceLabel)}</strong>
            </article>
            <article class="discovery-product-point">
              <span>Best for</span>
              <strong>${escapeHtml(gift.bestFor)}</strong>
            </article>
            <article class="discovery-product-point">
              <span>Mood</span>
              <strong>${escapeHtml(gift.vibe || gift.badge)}</strong>
            </article>
          </div>
          <div class="discovery-product-route">
            <span>Merchant path</span>
            <strong>${escapeHtml(merchantName(gift))}</strong>
            <p>${
              usesAffiliateSearchFallback(gift)
                ? "Use the Amazon search link here to find the current listing, then finish checkout on the merchant site."
                : usesDirectMerchantPath(gift)
                  ? `Open the ${merchantName(gift)} product page here, then finish checkout on the merchant site.`
                  : "Open the merchant listing here, then finish checkout on the merchant site."
            }</p>
          </div>
          <div class="discovery-actions">
            ${renderAffiliateAnchor(gift, `product-${gift.slug}-primary`, "Buy now")}
            ${
              matchingGuides[0]
                ? `<a class="discovery-text-link" href="/${matchingGuides[0].slug}/">See the best matching guide</a>`
                : ""
            }
            ${renderPaidLinkNote(gift)}
          </div>
          <p class="discovery-product-note">${escapeHtml(priceEstimateNote)} Checkout and final pricing happen on the merchant site.</p>
        </aside>
      </section>

          ${renderProductContextSection(gift, matchingGuides)}
          ${renderProductComparisonSection(gift, relatedProducts)}

      ${
        matchingGuides.length
          ? `<section class="discovery-section" id="product-guides">
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
      </section>`
          : ""
      }

          ${
            matchingHotStories.length
              ? `<section class="discovery-section" id="product-hot">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Hot</p>
          <h2>Hot stories using this pick</h2>
        </div>
        <div class="discovery-related">
          ${matchingHotStories
            .map(
              (story) => `<a class="discovery-related-link" href="/hot/${story.slug}/">
            <span>${escapeHtml(story.trendLabel)}</span>
            <strong>${escapeHtml(story.h1)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>`
              : ""
          }

          <section class="discovery-section" id="product-related">
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

          ${renderFaqSection("product-faq", "Quick answers", faqs)}

          ${renderProductEditorialSection(gift)}
        </div>
        ${productRail}
      </div>
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

function productHubMeta(gift) {
  const guideCount = guideUsageCount(gift.id);
  const hotCount = hotStoryUsageCount(gift.id);
  const context = [];

  if (usesDirectMerchantPath(gift)) {
    context.push(`${merchantName(gift)} checkout`);
  } else if (gift.amazonAsin) {
    context.push("Amazon checkout");
  }

  if (guideCount) {
    context.push(`${guideCount} guide${guideCount === 1 ? "" : "s"}`);
  }

  if (hotCount) {
    context.push(`${hotCount} hot page${hotCount === 1 ? "" : "s"}`);
  }

  return [gift.priceLabel, ...context].join(" · ");
}

function featuredProductHubPicks() {
  return [...indexableSeoCatalog]
    .sort((left, right) => {
      const usageDelta = (guideUsageCount(right.id) + hotStoryUsageCount(right.id)) - (guideUsageCount(left.id) + hotStoryUsageCount(left.id));

      if (usageDelta !== 0) {
        return usageDelta;
      }

      const merchantDelta = Number(usesDirectMerchantPath(right)) - Number(usesDirectMerchantPath(left));

      if (merchantDelta !== 0) {
        return merchantDelta;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 8);
}

function renderProductIndex(freshness = lastmodPlaceholder) {
  const canonical = `${siteUrl}/gift/`;
  const featuredProducts = featuredProductHubPicks();
  const directMerchantProducts = indexableSeoCatalog.filter((gift) => usesDirectMerchantPath(gift));
  const allProductLinks = [...indexableSeoCatalog]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((gift) => ({
      href: `/gift/${gift.slug}/`,
      label: gift.name,
      meta: productHubMeta(gift),
    }));
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Product pages",
    description: "Direct product-level gift pages with merchant paths, price bands, and surrounding guide context.",
    url: canonical,
    dateModified: freshness.isoDate,
    mainEntity: {
      "@id": `${canonical}#list`,
    },
    publisher: siteOrganizationSchema,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
    mentions: featuredProducts.map((gift) => ({
      "@type": "Product",
      name: gift.name,
      url: productUrl(gift),
    })),
    ...pageTrustSchemaFields(),
  };
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: "Products", href: canonical },
  ]);
  const itemListSchema = buildLinkedItemListSchema("Product pages", canonical, allProductLinks);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product pages | ShopForHer</title>
  <meta name="description" content="Browse the full index of ShopForHer product pages with price ranges, merchant paths, and nearby guide context.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${attributionScriptTag()}
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("products", [
      { label: "Home", href: "/" },
      { label: "Products" },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Products</p>
        <h1>Product pages</h1>
        <p class="discovery-intro">Use this hub when you already want the exact item and need the price band, merchant path, and nearby guide context fast.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
          <span>${indexableSeoCatalog.length} pages</span>
          <span>Off-site merchant checkout</span>
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Featured</p>
          <h2>Product pages with the strongest site context</h2>
        </div>
        <p class="discovery-section-note">These products show up most often across evergreen guides and hot pages, so they are the fastest entries when you want both a direct product read and surrounding comparison context.</p>
        <div class="discovery-related">
          ${featuredProducts
            .map(
              (gift) => `<a class="discovery-related-link" href="/gift/${gift.slug}/">
            <span>${escapeHtml(productHubMeta(gift))}</span>
            <strong>${escapeHtml(gift.name)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>

      ${
        directMerchantProducts.length
          ? `<section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Direct merchant</p>
          <h2>Pages with direct merchant checkout paths</h2>
        </div>
        <p class="discovery-section-note">Use these when you want the product page to land on the brand site instead of an Amazon listing.</p>
        <div class="discovery-related">
          ${directMerchantProducts
            .map(
              (gift) => `<a class="discovery-related-link" href="/gift/${gift.slug}/">
            <span>${escapeHtml(productHubMeta(gift))}</span>
            <strong>${escapeHtml(gift.name)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>`
          : ""
      }

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Browse</p>
          <h2>All indexable product pages</h2>
        </div>
        <div class="discovery-related">
          ${allProductLinks
            .map(
              (entry) => `<a class="discovery-related-link" href="${entry.href}">
            <span>${escapeHtml(entry.meta)}</span>
            <strong>${escapeHtml(entry.label)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>

      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Trust</p>
          <h2>Method and correction path</h2>
        </div>
        ${renderTrustResourceLinks("Open these pages when you want the methodology behind the product pages, the site background, or the correction route.")}
      </section>
    </main>
    ${renderDiscoveryFooter({
      notes: ["Product pages are built for exact-item lookup, not exhaustive merchant catalog coverage."],
      includeAffiliateDisclosure: true,
    })}
  </div>
</body>
</html>`;
}

function buildStaticDateSpotMapsUrl(city, spot) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", [spot.name, spot.type, spot.area, city.city].filter(Boolean).join(", "));
  return url.toString();
}

function uniqueDateCityAreas(city) {
  return [...new Set((city?.spots || []).map((spot) => spot.area).filter(Boolean))];
}

function dateCityIndexMeta(city) {
  const areaCount = uniqueDateCityAreas(city).length;

  return [
    city?.spots?.length ? `${city.spots.length} format${city.spots.length === 1 ? "" : "s"}` : null,
    areaCount ? `${areaCount} neighborhood${areaCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean).join(" · ");
}

function hasSpecificDateSpotBookingUrl(spot) {
  if (!spot?.bookingUrl) {
    return false;
  }

  try {
    const url = new URL(spot.bookingUrl);
    const isOpenTable = url.hostname === "www.opentable.com" || url.hostname === "opentable.com";
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";

    if (!isOpenTable) {
      return true;
    }

    if ((normalizedPath === "/" || normalizedPath === "/nearby") && !url.search) {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

function resolveStaticDateSpotAction(city, spot) {
  if (hasSpecificDateSpotBookingUrl(spot)) {
    return {
      href: spot.bookingUrl,
      label: "Open booking",
    };
  }

  return {
    href: buildStaticDateSpotMapsUrl(city, spot),
    label: "Open in Maps",
  };
}

function buildDateCityFaqSchema(city) {
  if (!city?.faqs?.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: city.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function renderGuideIndex(freshness = lastmodPlaceholder) {
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
    dateModified: freshness.isoDate,
    publisher: siteOrganizationSchema,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
  };
  const guideLinks = indexableSeoGuides.map((guide) => ({
    href: `/${guide.slug}/`,
    label: guide.h1,
  }));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: "Guides", href: `${siteUrl}/guides/` },
  ]);
  const itemListSchema = buildLinkedItemListSchema("Gift guides", `${siteUrl}/guides/`, guideLinks);

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
  ${attributionScriptTag()}
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("guides", [
      { label: "Home", href: "/" },
      { label: "Guides" },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Index</p>
        <h1>Gift guides</h1>
        <p class="discovery-intro">Real landing pages for the main buying intents on ShopForHer.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
          <span>${indexableSeoGuides.length} pages</span>
        </div>
      </section>
      ${groups
        .map(([groupId, groupTitle]) => {
          const entries = indexableSeoGuides.filter((guide) => guide.group === groupId);
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

function renderDatesIndex(freshness = lastmodPlaceholder) {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Date spots",
    description: "Neighborhood-led city date pages with cleaner planning paths for dinner, drinks, and follow-up moves.",
    url: `${siteUrl}/dates/`,
    dateModified: freshness.isoDate,
    publisher: siteOrganizationSchema,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
  };
  const cityLinks = seoDateCities.map((city) => ({
    href: `/dates/${city.slug}/`,
    label: city.h1,
  }));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: "Plans", href: `${siteUrl}/dates/` },
  ]);
  const itemListSchema = buildLinkedItemListSchema("Date spots", `${siteUrl}/dates/`, cityLinks);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Date spots | ShopForHer</title>
  <meta name="description" content="Neighborhood-led city date pages with cleaner planning paths for dinner, drinks, and follow-up moves.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${siteUrl}/dates/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${attributionScriptTag()}
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("plans", [
      { label: "Home", href: "/" },
      { label: "Plans" },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Plans</p>
        <h1>Date spots</h1>
        <p class="discovery-intro">Neighborhood-led city pages for dinner, drinks, and lower-friction date-night planning.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
          <span>${seoDateCities.length} cities</span>
          <span>Planning pages, not live inventory</span>
        </div>
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
            <span>${escapeHtml(dateCityIndexMeta(city) || "City page")}</span>
            <strong>${escapeHtml(city.city)}</strong>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    ${renderDiscoveryFooter({
      notes: ["Plan pages summarize cleaner neighborhood lanes and hand off to external booking or map destinations."],
      includeAffiliateDisclosure: false,
    })}
  </div>
</body>
</html>`;
}

function renderDateCityPage(city, freshness = lastmodPlaceholder) {
  const canonical = `${siteUrl}/dates/${city.slug}/`;
  const areaCount = uniqueDateCityAreas(city).length;
  const faqSchema = buildDateCityFaqSchema(city);
  const relatedCities = seoDateCities.filter((entry) => entry.slug !== city.slug);
  const cityRail = renderPageRail([
    {
      kicker: "City snapshot",
      title: `${city.city} date lanes`,
      body: city.positioning || city.description,
      pills: [
        `Updated ${freshness.displayDate}`,
        `${city.spots.length} format${city.spots.length === 1 ? "" : "s"}`,
        `${areaCount} neighborhood${areaCount === 1 ? "" : "s"}`,
      ],
      emphasis: true,
    },
    {
      kicker: "Quick jumps",
      title: "What to read first",
      body: "Start with the date format, then use the neighborhood read and planning notes to tighten the plan.",
      links: [
        { href: "#date-spots", label: "Simple date options", meta: `${city.spots.length} plan shape${city.spots.length === 1 ? "" : "s"}` },
        ...(city.lanes?.length ? [{ href: "#date-lanes", label: "Neighborhood reads", meta: `${city.lanes.length} lane${city.lanes.length === 1 ? "" : "s"}` }] : []),
        ...(city.planningTips?.length ? [{ href: "#date-tips", label: "Keep the plan easy", meta: `${city.planningTips.length} planning note${city.planningTips.length === 1 ? "" : "s"}` }] : []),
        ...(city.faqs?.length ? [{ href: "#date-faq", label: "Quick answers", meta: `${city.faqs.length} FAQ${city.faqs.length === 1 ? "" : "s"}` }] : []),
      ],
    },
    relatedCities.length
      ? {
          kicker: "Other cities",
          title: "Browse other city pages",
          body: "Move here if the plan changed cities or you want a different neighborhood read.",
          links: relatedCities.map((entry) => ({
            href: `/dates/${entry.slug}/`,
            label: entry.city,
            meta: dateCityIndexMeta(entry) || "City page",
          })),
        }
      : null,
  ]);
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: city.h1,
    description: city.description,
    url: canonical,
    dateModified: freshness.isoDate,
    mainEntityOfPage: canonical,
    publisher: siteOrganizationSchema,
    about: {
      "@type": "Place",
      name: city.city,
    },
    ...pageTrustSchemaFields(),
  };

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: "Plans", href: `${siteUrl}/dates/` },
    { label: city.city, href: canonical },
  ]);

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
  ${attributionScriptTag()}
  ${jsonLdScript(localBusinessSchema)}
  ${jsonLdScript(breadcrumbSchema)}
  ${faqSchema ? jsonLdScript(faqSchema) : ""}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("plans", [
      { label: "Home", href: "/" },
      { label: "Plans", href: "/dates/" },
      { label: city.city },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Plans</p>
        <h1>${escapeHtml(city.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(city.intro)}</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
          <span>${city.spots.length} plan format${city.spots.length === 1 ? "" : "s"}</span>
          <span>${areaCount} neighborhood${areaCount === 1 ? "" : "s"}</span>
          <span>Maps or booking handoff</span>
        </div>
      </section>
      <div class="discovery-page-main">
        <div class="discovery-page-stack">
          <section class="discovery-section" id="date-spots">
            <div class="discovery-section-head">
              <p class="discovery-kicker">Places</p>
              <h2>Simple date options</h2>
            </div>
            <p class="discovery-section-note">${escapeHtml(city.positioning || "Use these as planning lanes to narrow the neighborhood and format before you book.")}</p>
            <ol class="discovery-list">
              ${city.spots
                .map((spot, index) => {
                  const action = resolveStaticDateSpotAction(city, spot);

                  return `<li class="discovery-item">
            <div class="discovery-item-head">
              <span class="discovery-rank">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>${escapeHtml(spot.name)}</h3>
                <p class="discovery-price">${escapeHtml(spot.type)} · ${escapeHtml(spot.area)}</p>
              </div>
            </div>
            <p class="discovery-copy">${escapeHtml(spot.note)}</p>
            <div class="discovery-actions">
              <a class="discovery-btn" href="${escapeHtml(action.href)}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>
            </div>
          </li>`;
                })
                .join("")}
            </ol>
          </section>
          ${
            city.lanes?.length
              ? `<section class="discovery-section" id="date-lanes">
            <div class="discovery-section-head">
              <p class="discovery-kicker">Neighborhoods</p>
              <h2>Which lane fits the night</h2>
            </div>
            <p class="discovery-section-note">Use this section when the real decision is not the exact venue yet. It helps narrow the right area and tone first.</p>
            <ol class="discovery-list">
              ${city.lanes
                .map(
                  (lane, index) => `<li class="discovery-item">
                <div class="discovery-item-head">
                  <span class="discovery-rank">${String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>${escapeHtml(lane.title)}</h3>
                    <p class="discovery-price">${escapeHtml(lane.area)} · ${escapeHtml(lane.bestFor)}</p>
                  </div>
                </div>
                <p class="discovery-copy">${escapeHtml(lane.note)}</p>
              </li>`
                )
                .join("")}
            </ol>
          </section>`
              : ""
          }
          ${
            city.planningTips?.length
              ? `<section class="discovery-section" id="date-tips">
            <div class="discovery-section-head">
              <p class="discovery-kicker">Game plan</p>
              <h2>How to keep the plan easy</h2>
            </div>
            <div class="discovery-faqs">
              ${city.planningTips
                .map(
                  (tip) => `<article class="discovery-faq">
                <h3>${escapeHtml(tip.title)}</h3>
                <p>${escapeHtml(tip.body)}</p>
              </article>`
                )
                .join("")}
            </div>
          </section>`
              : ""
          }
          ${renderFaqSection("date-faq", "Quick answers", city.faqs || [])}
          <section class="discovery-section" id="date-trust">
            <div class="discovery-section-head">
              <p class="discovery-kicker">Trust</p>
              <h2>How these pages work</h2>
            </div>
            ${renderTrustResourceLinks("These are neighborhood-led planning pages, not live ranked venue lists. Use the trust pages if you want the site background, methodology, or correction route.")}
          </section>
        </div>
        ${cityRail}
      </div>
    </main>
    ${renderDiscoveryFooter({
      notes: [
        "These plan pages are neighborhood-led editorial starting points, not real-time inventory.",
        "Reservation availability and checkout happen on the destination booking or map partner site.",
      ],
      includeAffiliateDisclosure: false,
    })}
  </div>
</body>
</html>`;
}

function renderHotIndex(freshness = lastmodPlaceholder) {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Hot gift trends",
    description: "Current-interest gift pages for her built from editor-tracked angles and product patterns.",
    url: `${siteUrl}/hot/`,
    dateModified: freshness.isoDate,
    publisher: siteOrganizationSchema,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
  };
  const storyLinks = seoHotStories.map((story) => ({
    href: `/hot/${story.slug}/`,
    label: story.h1,
  }));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: "Hot", href: `${siteUrl}/hot/` },
  ]);
  const itemListSchema = buildLinkedItemListSchema("Hot gift trends", `${siteUrl}/hot/`, storyLinks);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hot gift trends | ShopForHer</title>
  <meta name="description" content="Current-interest gift pages for her built from editor-tracked angles and product patterns.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${siteUrl}/hot/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${attributionScriptTag()}
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("hot", [
      { label: "Home", href: "/" },
      { label: "Hot" },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Hot</p>
        <h1>Trending gift pages</h1>
        <p class="discovery-intro">Editor-tracked current-interest pages for the faster-moving side of ShopForHer: sharper picks, cleaner buys, and live-feeling angles.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
          <span>${seoHotStories.length} stories</span>
          <span>Editor-tracked, not metric-led</span>
        </div>
      </section>
      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Feed</p>
          <h2>Current lanes</h2>
        </div>
        <div class="discovery-hot-story-grid">
          ${seoHotStories
            .map((story) => `<a class="discovery-hot-story-card" href="/hot/${story.slug}/">
            <div class="discovery-hot-story-media">
              <img src="${escapeHtml(hotThumbUrl(story))}" alt="${escapeHtml(story.h1)} thumbnail" loading="lazy">
              <div class="discovery-hot-story-chip-row">
                ${hotStoryCardChips(story).map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}
              </div>
            </div>
            <div class="discovery-hot-story-body">
              <span>${escapeHtml(story.trendLabel)}</span>
              <strong>${escapeHtml(story.h1)}</strong>
              <p>${escapeHtml(story.description)}</p>
            </div>
          </a>`
            )
            .join("")}
        </div>
      </section>
    </main>
    ${renderDiscoveryFooter({
      notes: ["Hot pages are editor-tracked current-interest reads, not sourced view-count reports."],
    })}
  </div>
</body>
</html>`;
}

function renderHotStoryPage(story, freshness = lastmodPlaceholder) {
  const items = hotStoryItems(story);
  const relatedGuides = story.relatedGuides.map((slug) => guideBySlug.get(slug)).filter(Boolean).filter(isIndexableGuidePage);
  const canonical = `${siteUrl}/hot/${story.slug}/`;
  const pageTitle = story.title;
  const description = story.description;
  const pageImage = hotThumbUrl(story);
  const pageImageAlt = `${story.h1} story image`;
  const leadGift = items[0] || null;
  const faqs = hotStoryFaqs(story, items, relatedGuides);
  const storySectionLinks = [
    { href: "#story-poster", label: "Story poster", meta: "Trend snapshot" },
    { href: "#story-angle", label: "Why this is moving", meta: "Read the lane" },
    { href: "#story-picks", label: "Products in this story", meta: `${items.length} picks` },
    ...(relatedGuides.length ? [{ href: "#story-related", label: "Related guides", meta: `${relatedGuides.length} more pages` }] : []),
    { href: "#story-faq", label: "Quick answers", meta: `${faqs.length} FAQ${faqs.length === 1 ? "" : "s"}` },
    { href: "#story-editorial", label: "Editorial notes", meta: "How this page was built" },
  ];
  const storyRail = renderPageRail([
    {
      kicker: "Story snapshot",
      title: story.h1,
      body: story.description,
      pills: hotStoryPagePills(story, items, relatedGuides),
      emphasis: true,
      cta: leadGift
        ? `<div class="discovery-actions discovery-actions-rail">
        <a class="discovery-text-link" href="/gift/${leadGift.slug}/">Open first product</a>
        ${
          relatedGuides[0]
            ? `<a class="discovery-text-link" href="/${relatedGuides[0].slug}/">Open matching guide</a>`
            : ""
        }
      </div>`
        : "",
    },
    {
      kicker: "On this page",
      title: "Jump to a section",
      links: storySectionLinks,
    },
    relatedGuides.length
      ? {
          kicker: "Keep browsing",
          title: "Related guides",
          body: "Move into a broader evergreen page if you want more context before you buy.",
          links: relatedGuides.slice(0, 4).map((guide) => ({
            href: `/${guide.slug}/`,
            label: guide.label,
            meta: guide.groupLabel,
          })),
        }
      : null,
  ]);
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#items`,
    name: story.h1,
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

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: story.h1,
    description,
    url: canonical,
    inLanguage: "en-US",
    dateModified: freshness.isoDate,
    mainEntityOfPage: canonical,
    mainEntity: {
      "@id": `${canonical}#items`,
    },
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
      name: story.label,
    },
    mentions: items.slice(0, 6).map((gift) => ({
      "@type": "Product",
      name: gift.name,
      url: productUrl(gift),
    })),
    keywords: [story.label, "gifts for her", "viral gifts", "trending gifts"].join(", "),
    ...pageTrustSchemaFields(),
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: story.h1,
    description,
    url: canonical,
    inLanguage: "en-US",
    mainEntityOfPage: canonical,
    dateModified: freshness.isoDate,
    image: [pageImage],
    author: editorialAuthorSchema,
    reviewedBy: editorialReviewerSchema,
    publisher: siteOrganizationSchema,
    articleSection: "Hot",
    keywords: [story.label, story.trendLabel, "gifts for her", "viral gifts"].join(", "),
    about: {
      "@type": "Thing",
      name: story.label,
    },
    mentions: items.slice(0, 6).map((gift) => ({
      "@type": "Product",
      name: gift.name,
      url: productUrl(gift),
    })),
    ...pageTrustSchemaFields(),
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
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(seoSite.name)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  ${socialImageMetaTags(pageImage, pageImageAlt)}
  <meta property="article:section" content="Hot">
  <meta property="article:tag" content="${escapeHtml(story.label)}">
  <meta property="article:modified_time" content="${escapeHtml(freshness.dateTime)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/discovery.css">
  ${attributionScriptTag()}
  ${jsonLdScript(collectionPageSchema)}
  ${jsonLdScript(articleSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(faqSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("hot", [
      { label: "Home", href: "/" },
      { label: "Hot", href: "/hot/" },
      { label: story.h1 },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Hot</p>
        <h1>${escapeHtml(story.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(story.intro)}</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
          ${hotStoryPagePills(story, items, relatedGuides).map((pill) => `<span>${escapeHtml(pill)}</span>`).join("")}
        </div>
      </section>
      <div class="discovery-page-main">
        <div class="discovery-page-stack">
          <section class="discovery-poster" id="story-poster">
        <img src="${escapeHtml(pageImage)}" alt="${escapeHtml(story.h1)} story image" loading="lazy">
        <div class="discovery-poster-copy">
          <span>${escapeHtml(story.label)}</span>
          <strong>${escapeHtml(story.trendLabel)}</strong>
        </div>
      </section>

          ${renderHotStoryAngleSection(story, items, relatedGuides)}

          <section class="discovery-section" id="story-picks">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Products</p>
          <h2>Picks in this story</h2>
        </div>
        <ol class="discovery-hot-item-list">
          ${items
            .map((gift, index) => {
              const thumbnailUrl = hotGiftThumbnailUrl(gift);
              const hasTikTokPoster = hotGiftHasTikTokPoster(gift);

              return `<li class="discovery-hot-item">
            <a class="discovery-hot-item-media" href="/gift/${gift.slug}/">
              <img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(gift.name)}" loading="lazy">
            </a>
            <div class="discovery-hot-item-body">
            <div class="discovery-item-head">
              <span class="discovery-rank">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3><a class="discovery-title-link" href="/gift/${gift.slug}/">${escapeHtml(gift.name)}</a></h3>
                <div class="discovery-pill-row is-inline">
                  <span>${escapeHtml(gift.priceLabel)}</span>
                  <span>${escapeHtml(gift.badge)}</span>
                  ${hasTikTokPoster ? "<span>TikTok</span>" : ""}
                </div>
              </div>
            </div>
            <p class="discovery-copy">${escapeHtml(gift.hook)} ${escapeHtml(gift.why)}</p>
            <div class="discovery-actions">
              <a class="discovery-text-link" href="/gift/${gift.slug}/">View product</a>
              ${renderAffiliateAnchor(gift, `hot-${story.slug}-list`)}
              ${renderPaidLinkNote(gift)}
            </div>
            </div>
          </li>`;
            })
            .join("")}
        </ol>
      </section>

          ${
            relatedGuides.length
              ? `<section class="discovery-section" id="story-related">
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
          </section>`
              : ""
          }

          ${renderFaqSection("story-faq", "Quick answers", faqs)}

          ${renderHotStoryEditorialSection(story, relatedGuides)}
        </div>
        ${storyRail}
      </div>
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

function renderTrustPage(page, freshness = lastmodPlaceholder) {
  const canonical = `${siteUrl}/${page.filename}`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    name: page.h1,
    description: page.description,
    url: canonical,
    inLanguage: "en-US",
    dateModified: freshness.isoDate,
    mainEntityOfPage: canonical,
    author: editorialAuthorSchema,
    reviewedBy: editorialReviewerSchema,
    publisher: siteOrganizationSchema,
    isPartOf: {
      "@type": "WebSite",
      name: seoSite.name,
      url: `${siteUrl}/`,
    },
    about: siteOrganizationSchema,
    ...pageTrustSchemaFields(),
  };
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: page.kicker, href: canonical },
  ]);

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
  ${attributionScriptTag()}
  ${jsonLdScript(pageSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("", [
      { label: "Home", href: "/" },
      { label: page.kicker },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">${escapeHtml(page.kicker)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="discovery-intro">${escapeHtml(page.intro)}</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
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
      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Trust</p>
          <h2>Related trust pages</h2>
        </div>
        ${renderTrustResourceLinks("Use the related trust pages when you want the site background, methodology, or contact route in one place.", [`/${page.filename}`])}
      </section>
    </main>
    ${renderDiscoveryFooter({
      notes: ["These pages exist so users, search engines, and AI assistants can understand the site and how it operates."],
    })}
  </div>
</body>
</html>`;
}

function renderSiteMapPage(freshness = lastmodPlaceholder) {
  const canonical = `${siteUrl}/site-map.html`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Site map",
    description: "Browse ShopForHer guides, hot pages, date pages, product pages, and trust pages in one crawlable index.",
    url: canonical,
    dateModified: freshness.isoDate,
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
      links: indexableSeoGuides.map((guide) => ({
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
      kicker: "Plans",
      title: "Date plans",
      links: [{ href: "/dates/", label: "Plans index", meta: "Index" }].concat(
        seoDateCities.map((city) => ({
          href: `/dates/${city.slug}/`,
          label: city.h1,
          meta: city.city,
        }))
      ),
    },
    {
      kicker: "Products",
      title: "Indexable product pages",
      links: [{ href: "/gift/", label: "Product pages index", meta: "Index" }].concat(indexableSeoCatalog.map((gift) => ({
        href: `/gift/${gift.slug}/`,
        label: gift.name,
        meta: gift.badge,
      }))),
    },
  ];
  const linkedCount = sections.reduce((total, section) => total + section.links.length, 0);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: `${siteUrl}/` },
    { label: "Site map", href: canonical },
  ]);
  const itemListSchema = buildLinkedItemListSchema(
    "Site map",
    canonical,
    sections.flatMap((section) => section.links)
  );

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
  ${attributionScriptTag()}
  ${jsonLdScript(pageSchema)}
  ${jsonLdScript(itemListSchema)}
  ${jsonLdScript(breadcrumbSchema)}
</head>
<body>
  <div class="discovery-shell">
    ${renderDiscoveryHeader("", [
      { label: "Home", href: "/" },
      { label: "Site map" },
    ])}
    <main class="discovery-main">
      <section class="discovery-hero">
        <p class="discovery-kicker">Directory</p>
        <h1>Site map</h1>
        <p class="discovery-intro">A full HTML index of the main ShopForHer pages for users, search engines, and AI assistants.</p>
        <div class="discovery-meta">
          <span>Updated ${escapeHtml(freshness.displayDate)}</span>
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
      ],
    })}
  </div>
</body>
</html>`;
}

function writeResolvedHtml(filePath, url, render) {
  const preview = render(lastmodPlaceholder);
  const lastmod = resolveLastmod(url, preview);
  const output = render(pageFreshness(lastmod));
  fs.writeFileSync(filePath, output);
  return lastmod;
}

function writeResolvedText(filePath, url, render) {
  const preview = render(lastmodPlaceholder);
  const lastmod = resolveLastmod(url, preview);
  const output = render(pageFreshness(lastmod));
  fs.writeFileSync(filePath, output);
  return lastmod;
}

function registerHomePageLastmod() {
  const homepagePath = path.join(rootDir, "index.html");

  if (!fs.existsSync(homepagePath)) {
    return;
  }

  const homepageSource = fs.readFileSync(homepagePath, "utf8");
  resolveLastmod(`${siteUrl}/`, homepageSource);
}

function writeGuidePages() {
  seoGuides.forEach((guide) => {
    const guideDir = path.join(publicDir, guide.slug);
    ensureDir(guideDir);
    writeResolvedHtml(path.join(guideDir, "index.html"), guideUrl(guide), (freshness) => renderGuidePage(guide, freshness));
  });

  const guidesDir = path.join(publicDir, "guides");
  ensureDir(guidesDir);
  writeResolvedHtml(path.join(guidesDir, "index.html"), `${siteUrl}/guides/`, (freshness) => renderGuideIndex(freshness));
}

function writeProductPages() {
  const giftDir = path.join(publicDir, "gift");
  ensureDir(giftDir);
  writeResolvedHtml(path.join(giftDir, "index.html"), `${siteUrl}/gift/`, (freshness) => renderProductIndex(freshness));

  seoCatalog.forEach((gift) => {
    const productDir = path.join(giftDir, gift.slug);
    ensureDir(productDir);
    writeResolvedHtml(path.join(productDir, "index.html"), productUrl(gift), (freshness) => renderProductPage(gift, freshness));
  });
}

function writeDatePages() {
  const datesDir = path.join(publicDir, "dates");
  ensureDir(datesDir);
  writeResolvedHtml(path.join(datesDir, "index.html"), `${siteUrl}/dates/`, (freshness) => renderDatesIndex(freshness));

  seoDateCities.forEach((city) => {
    const cityDir = path.join(datesDir, city.slug);
    ensureDir(cityDir);
    writeResolvedHtml(path.join(cityDir, "index.html"), `${siteUrl}/dates/${city.slug}/`, (freshness) => renderDateCityPage(city, freshness));
  });
}

function writeHotPages() {
  const hotDir = path.join(publicDir, "hot");
  ensureDir(hotDir);
  writeResolvedHtml(path.join(hotDir, "index.html"), `${siteUrl}/hot/`, (freshness) => renderHotIndex(freshness));

  seoHotStories.forEach((story) => {
    const storyDir = path.join(hotDir, story.slug);
    ensureDir(storyDir);
    writeResolvedHtml(path.join(storyDir, "index.html"), `${siteUrl}/hot/${story.slug}/`, (freshness) => renderHotStoryPage(story, freshness));
  });
}

function writeTrustPages() {
  trustPages.forEach((page) => {
    writeResolvedHtml(path.join(publicDir, page.filename), `${siteUrl}/${page.filename}`, (freshness) => renderTrustPage(page, freshness));
  });
}

function writeSiteMapPage() {
  writeResolvedHtml(path.join(publicDir, "site-map.html"), `${siteUrl}/site-map.html`, (freshness) => renderSiteMapPage(freshness));
}

function writeFeed() {
  const items = [
    ...trustPages.map((page) => ({
      title: page.h1,
      url: `${siteUrl}/${page.filename}`,
      description: page.description,
      lastmod: pageLastmod(`${siteUrl}/${page.filename}`),
    })),
    ...indexableSeoGuides.map((guide) => ({
      title: guide.h1,
      url: guideUrl(guide),
      description: guide.description,
      lastmod: pageLastmod(guideUrl(guide)),
    })),
    ...seoHotStories.map((story) => ({
      title: story.h1,
      url: `${siteUrl}/hot/${story.slug}/`,
      description: story.description,
      lastmod: pageLastmod(`${siteUrl}/hot/${story.slug}/`),
    })),
    ...seoDateCities.map((city) => ({
      title: city.h1,
      url: `${siteUrl}/dates/${city.slug}/`,
      description: city.description,
      lastmod: pageLastmod(`${siteUrl}/dates/${city.slug}/`),
    })),
    ...indexableSeoCatalog.map((gift) => ({
      title: gift.name,
      url: productUrl(gift),
      description: `${gift.hook} ${gift.why}`,
      lastmod: pageLastmod(productUrl(gift)),
    })),
  ];
  const channelDate = utcPubDate(latestLastmod(items.map((item) => item.url)));
  const render = () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(seoSite.name)}</title>
    <description>${escapeHtml(seoSite.description)}</description>
    <link>${siteUrl}/</link>
    <lastBuildDate>${channelDate}</lastBuildDate>
    <language>en-us</language>
${items
  .map(
    (item) => `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${utcPubDate(item.lastmod)}</pubDate>
      <description>${escapeHtml(item.description)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;

  writeResolvedText(path.join(publicDir, "feed.xml"), `${siteUrl}/feed.xml`, render);
}

function buildProductCatalogEntries() {
  return seoCatalog.map((gift) => {
    const range = priceRange(gift);
    const indexState = productIndexState(gift);

    return {
      id: gift.id,
      slug: gift.slug,
      name: gift.name,
      brand: gift.brand || null,
      pageUrl: productUrl(gift),
      affiliateUrl: affiliateUrl(gift),
      merchantName: merchantName(gift),
      merchantProductUrl: merchantProductUrl(gift) || null,
      affiliatePathType: usesAffiliateSearchFallback(gift)
        ? "amazon-search"
        : usesDirectMerchantPath(gift)
          ? "direct-merchant-url"
          : "direct-product",
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
      searchIndexable: indexState.indexable,
      indexStatus: indexState.reason,
      updatedAt: pageLastmod(productUrl(gift)),
    };
  });
}

function writeProductCatalog() {
  writeResolvedText(path.join(publicDir, "product-catalog.json"), `${siteUrl}/product-catalog.json`, (freshness) => {
    const payload = {
      generatedAt: freshness.dateTime,
      site: {
        name: seoSite.name,
        url: `${siteUrl}/`,
        guideCatalogUrl: `${siteUrl}/guide-catalog.json`,
        productCatalogUrl: `${siteUrl}/product-catalog.json`,
        editorialPolicyUrl: `${siteUrl}${seoSite.editorialPath}`,
        affiliateDisclosure: AMAZON_ASSOCIATE_DISCLOSURE,
        checkout: "offsite",
      },
      products: buildProductCatalogEntries(),
    };

    return `${JSON.stringify(payload, null, 2)}\n`;
  });
}

function buildGuideCatalogEntries() {
  return seoGuides.map((guide) => {
    const items = guideItems(guide);
    const relatedGuides = (guide.related || []).map((slug) => guideBySlug.get(slug)).filter(Boolean).filter(isIndexableGuidePage);
    const overlap = guideOverlapDetails(guide, items);
    const indexState = guideIndexState(guide);

    return {
      slug: guide.slug,
      pageUrl: guideUrl(guide),
      title: guide.title,
      h1: guide.h1,
      description: guide.description,
      intro: guide.intro,
      group: guide.group,
      groupLabel: guide.groupLabel,
      searchIndexable: indexState.indexable,
      indexStatus: indexState.reason,
      updatedAt: pageLastmod(guideUrl(guide)),
      featuredGiftId: items[0]?.id || null,
      featuredGiftUrl: items[0] ? productUrl(items[0]) : null,
      selectionMethod: guide.selectionMethod || "",
      bestUseCase: guide.bestUseCase || "",
      avoidWhen: guide.avoidWhen || "",
      buyerSignals: guide.buyerSignals || [],
      bestFits: (guide.bestFits || []).map((fit) => {
        const gift = catalogById.get(fit.giftId);

        return {
          ...fit,
          giftSlug: gift?.slug || "",
          giftUrl: gift ? productUrl(gift) : null,
        };
      }),
      pickLanes: (guide.pickLanes || []).map((lane) => {
        const gift = catalogById.get(lane.giftId);

        return {
          ...lane,
          giftSlug: gift?.slug || "",
          giftUrl: gift ? productUrl(gift) : null,
        };
      }),
      avoidNotes: guide.avoidNotes || [],
      faqs: guideFaqs(guide, items).map((faq) => ({
        question: faq.q,
        answer: faq.a,
      })),
      products: items.map((gift) => ({
        id: gift.id,
        slug: gift.slug,
        name: gift.name,
        url: productUrl(gift),
        price: gift.priceLabel,
        badge: gift.badge,
        bestFor: gift.bestFor,
        searchIndexable: isIndexableProductPage(gift),
      })),
      relatedGuides: relatedGuides.map((entry) => ({
        slug: entry.slug,
        label: entry.label,
        h1: entry.h1,
        url: guideUrl(entry),
      })),
      exploreProducts: guideExpansionProducts(guide, items).map((gift) => ({
        id: gift.id,
        slug: gift.slug,
        name: gift.name,
        url: productUrl(gift),
        badge: gift.badge,
        bestFor: gift.bestFor,
        guideCount: guideUsageCount(gift.id),
      })),
      uniqueness: {
        needsEditorialRefresh: overlap.needsEditorialRefresh,
        distinctiveProducts: overlap.distinctiveItems.map((gift) => ({
          id: gift.id,
          slug: gift.slug,
          name: gift.name,
          url: productUrl(gift),
          guideCount: guideUsageCount(gift.id),
        })),
        overusedProducts: overlap.overusedItems.map((gift) => ({
          id: gift.id,
          slug: gift.slug,
          name: gift.name,
          url: productUrl(gift),
          guideCount: guideUsageCount(gift.id),
        })),
        relatedGuideOverlap: overlap.relatedOverlap.map((entry) => ({
          slug: entry.slug,
          label: entry.label,
          h1: entry.h1,
          url: entry.url,
          sharedCount: entry.sharedCount,
          sharedItems: entry.sharedItems,
        })),
      },
    };
  });
}

function writeGuideCatalog() {
  writeResolvedText(path.join(publicDir, "guide-catalog.json"), `${siteUrl}/guide-catalog.json`, (freshness) => {
    const payload = {
      generatedAt: freshness.dateTime,
      site: {
        name: seoSite.name,
        url: `${siteUrl}/`,
        guideCatalogUrl: `${siteUrl}/guide-catalog.json`,
        productCatalogUrl: `${siteUrl}/product-catalog.json`,
        editorialPolicyUrl: `${siteUrl}${seoSite.editorialPath}`,
        contactUrl: `${siteUrl}${seoSite.contactPath}`,
      },
      guides: buildGuideCatalogEntries(),
    };

    return `${JSON.stringify(payload, null, 2)}\n`;
  });
}

function renderSitemapUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

function renderSitemapIndex(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <sitemap>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>
`;
}

function writeSitemaps() {
  const staticPages = [
    "/",
    "/guides/",
    "/hot/",
    "/gift/",
    "/dates/",
    "/site-map.html",
    seoSite.aboutPath,
    seoSite.editorialPath,
    seoSite.contactPath,
  ];
  const sitemapFiles = [
    {
      filename: "sitemap-pages.xml",
      urls: staticPages.map((url) => ({ loc: `${siteUrl}${url}`, lastmod: pageLastmod(`${siteUrl}${url}`) })),
    },
    {
      filename: "sitemap-guides.xml",
      urls: indexableSeoGuides.map((guide) => ({ loc: guideUrl(guide), lastmod: pageLastmod(guideUrl(guide)) })),
    },
    {
      filename: "sitemap-hot.xml",
      urls: seoHotStories.map((story) => ({
        loc: `${siteUrl}/hot/${story.slug}/`,
        lastmod: pageLastmod(`${siteUrl}/hot/${story.slug}/`),
      })),
    },
    {
      filename: "sitemap-dates.xml",
      urls: seoDateCities.map((city) => ({
        loc: `${siteUrl}/dates/${city.slug}/`,
        lastmod: pageLastmod(`${siteUrl}/dates/${city.slug}/`),
      })),
    },
    {
      filename: "sitemap-products.xml",
      urls: indexableSeoCatalog.map((gift) => ({ loc: productUrl(gift), lastmod: pageLastmod(productUrl(gift)) })),
    },
  ];
  const sitemapEntries = sitemapFiles.map((entry) => {
    const sitemapUrl = `${siteUrl}/${entry.filename}`;
    const lastmod = writeResolvedText(path.join(publicDir, entry.filename), sitemapUrl, () => renderSitemapUrlset(entry.urls));

    return {
      loc: sitemapUrl,
      lastmod,
    };
  });
  writeResolvedText(path.join(publicDir, "sitemap.xml"), `${siteUrl}/sitemap.xml`, () => renderSitemapIndex(sitemapEntries));
}

function writeLlmsFiles() {
  const renderLlms = (freshness) => [
    "# ShopForHer",
    "",
    `> ${seoSite.description}`,
    "",
    "## Main discovery indexes",
    `- ${siteUrl}/guides/`,
    `- ${siteUrl}/hot/`,
    `- ${siteUrl}/gift/`,
    `- ${siteUrl}/dates/`,
    `- ${siteUrl}/site-map.html`,
    `- ${siteUrl}/feed.xml`,
    `- ${siteUrl}/guide-catalog.json`,
    `- ${siteUrl}/product-catalog.json`,
    "",
    "## Trust pages",
    `- [About ShopForHer](${siteUrl}${seoSite.aboutPath})`,
    `- [Editorial policy](${siteUrl}${seoSite.editorialPath})`,
    `- [Contact ShopForHer](${siteUrl}${seoSite.contactPath})`,
    "",
    "## Discovery files",
    `- [RSS feed](${siteUrl}/feed.xml)`,
    `- [Guide catalog JSON](${siteUrl}/guide-catalog.json)`,
    `- [Product catalog JSON](${siteUrl}/product-catalog.json)`,
    `- [llms.txt](${siteUrl}/llms.txt)`,
    `- [llms-full.txt](${siteUrl}/llms-full.txt)`,
    "",
    "## Agent guidance",
    "- Prefer /guide-catalog.json for guide intent, use cases, FAQs, related guides, ranked product lists, and guide-overlap metadata.",
    "- Prefer /product-catalog.json for product facts, merchant paths, price bands, and per-product updatedAt values.",
    "- Treat all prices as recent ranges rather than guaranteed live prices.",
    "- Use page-level updatedAt values for freshness. Dates only move when that page or file changes.",
    "- Use /editorial-policy.html for methodology and /contact.html for corrections or verification.",
    "",
    "## Top guides",
    ...indexableSeoGuides.map((guide) => `- [${guide.h1}](${siteUrl}/${guide.slug}/)`),
    "",
    "## Hot pages",
    ...seoHotStories.map((story) => `- [${story.h1}](${siteUrl}/hot/${story.slug}/)`),
    "",
    "## Product pages",
    ...indexableSeoCatalog.map((gift) => `- [${gift.name}](${productUrl(gift)})`),
    "",
    "## Plans",
    ...seoDateCities.map((city) => `- [${city.h1}](${siteUrl}/dates/${city.slug}/)`),
    "",
    "## Notes",
    "- Affiliate links may be present.",
    "- Product checkout happens on the merchant site.",
    "- Product pages without a stable merchant product URL stay crawlable but are kept out of search indexing until a direct merchant path is stored.",
    "- A small set of overlapping guide pages are intentionally kept out of search indexing until they are more distinct.",
    "- Editorial policy is published on-site.",
    "- Product catalog JSON includes merchant-path and price-band metadata.",
    `- Discovery files refreshed: ${freshness.displayDate}.`,
    "",
    "## Contact",
    `- ${seoSite.contactEmail}`,
  ].join("\n");

  const renderLlmsFull = (freshness) => [
    "# ShopForHer full index",
    "",
    `Base URL: ${siteUrl}/`,
    `Updated: ${freshness.isoDate}`,
    "",
    `- Guides index: ${siteUrl}/guides/`,
    `- Hot index: ${siteUrl}/hot/`,
    `- Products index: ${siteUrl}/gift/`,
    `- Plans index: ${siteUrl}/dates/`,
    `- About: ${siteUrl}${seoSite.aboutPath}`,
    `- Editorial policy: ${siteUrl}${seoSite.editorialPath}`,
    `- Contact: ${siteUrl}${seoSite.contactPath}`,
    `- Site map: ${siteUrl}/site-map.html`,
    `- Feed: ${siteUrl}/feed.xml`,
    `- Guide catalog: ${siteUrl}/guide-catalog.json`,
    `- Product catalog: ${siteUrl}/product-catalog.json`,
    `- llms.txt: ${siteUrl}/llms.txt`,
    `- llms-full.txt: ${siteUrl}/llms-full.txt`,
    ...indexableSeoGuides.map((guide) => `- ${guide.h1}: ${siteUrl}/${guide.slug}/`),
    ...seoHotStories.map((story) => `- ${story.h1}: ${siteUrl}/hot/${story.slug}/`),
    ...seoDateCities.map((city) => `- ${city.h1}: ${siteUrl}/dates/${city.slug}/`),
    ...indexableSeoCatalog.map((gift) => `- ${gift.name}: ${productUrl(gift)}`),
  ].join("\n");

  writeResolvedText(path.join(publicDir, "llms.txt"), `${siteUrl}/llms.txt`, renderLlms);
  writeResolvedText(path.join(publicDir, "llms-full.txt"), `${siteUrl}/llms-full.txt`, renderLlmsFull);
}

function writeLastmodCache() {
  const ordered = Object.fromEntries(Object.entries(nextLastmodCache).sort(([left], [right]) => left.localeCompare(right)));
  fs.writeFileSync(lastmodCachePath, `${JSON.stringify(ordered, null, 2)}\n`);
}

ensureDir(publicDir);
registerHomePageLastmod();
logGuideOverlapWarnings();
writeTrustPages();
writeSiteMapPage();
writeGuidePages();
writeHotPages();
writeProductPages();
writeDatePages();
writeFeed();
writeGuideCatalog();
writeProductCatalog();
writeLlmsFiles();
writeSitemaps();
writeLastmodCache();
