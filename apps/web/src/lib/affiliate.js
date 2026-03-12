export const AMAZON_ASSOCIATE_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";
export const AMAZON_PAID_LINK_NOTE = "Paid link to Amazon";
export const DIRECT_MERCHANT_LINK_NOTE = "Direct merchant link";
export const AMAZON_AFFILIATE_REL = "nofollow sponsored noopener noreferrer";
const merchantNamesByHost = new Map([
  ["amazon", "Amazon"],
  ["anthropologie", "Anthropologie"],
  ["bloomingdales", "Bloomingdale's"],
  ["crateandbarrel", "Crate & Barrel"],
  ["etsy", "Etsy"],
  ["freepeople", "Free People"],
  ["giftpals", "Giftpals"],
  ["lululemon", "Lululemon"],
  ["macys", "Macy's"],
  ["neimanmarcus", "Neiman Marcus"],
  ["nordstrom", "Nordstrom"],
  ["revolve", "Revolve"],
  ["saksfifthavenue", "Saks Fifth Avenue"],
  ["sephora", "Sephora"],
  ["shopbop", "Shopbop"],
  ["soldejaneiro", "Sol de Janeiro"],
  ["spanx", "Spanx"],
  ["target", "Target"],
  ["ulta", "Ulta"],
  ["walmart", "Walmart"],
]);

export function merchantProductUrl(gift) {
  const asin = gift?.amazonAsin || gift?.asin;

  if (gift?.sourceProductUrl) {
    return gift.sourceProductUrl;
  }

  if (gift?.affiliateUrl) {
    return gift.affiliateUrl;
  }

  if (asin) {
    return `https://www.amazon.com/dp/${asin}`;
  }

  return "";
}

export function usesAffiliateSearchFallback(gift) {
  return !merchantProductUrl(gift);
}

export function usesDirectMerchantPath(gift) {
  return Boolean(gift?.sourceProductUrl && !gift?.affiliateUrl && !(gift?.amazonAsin || gift?.asin));
}

export function resolveMerchantNameFromUrl(urlValue) {
  try {
    const hostname = new URL(urlValue).hostname.toLowerCase();

    if (/(^|\.)amazon\./i.test(hostname)) {
      return "Amazon";
    }

    const parts = hostname.replace(/^www\./i, "").split(".").filter(Boolean);
    if (parts.length === 0) {
      return "";
    }

    let hostKey = parts.length >= 2 ? parts.at(-2) : parts[0];
    if (hostKey === "co" && parts.length >= 3) {
      hostKey = parts.at(-3);
    }

    if (merchantNamesByHost.has(hostKey)) {
      return merchantNamesByHost.get(hostKey);
    }

    return hostKey
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  } catch (error) {
    return "";
  }
}

export function resolveGiftMerchantName(gift, fallbackMerchant = "Amazon") {
  if (gift?.merchantName) {
    return gift.merchantName;
  }

  const inferredMerchant = resolveMerchantNameFromUrl(merchantProductUrl(gift));
  return inferredMerchant || fallbackMerchant;
}

export function resolveGiftCommerceRel(gift) {
  return usesDirectMerchantPath(gift) ? "noopener noreferrer" : AMAZON_AFFILIATE_REL;
}

export function resolveGiftCommerceLinkType(gift) {
  return usesDirectMerchantPath(gift) ? "merchant" : "amazon";
}

export function buildAffiliateDataAttributes({
  gift,
  placement = "unknown",
  merchant = "Amazon",
  slug = "",
  linkType = "amazon",
} = {}) {
  return {
    "data-affiliate-link": linkType,
    "data-affiliate-merchant": merchant,
    "data-affiliate-placement": placement,
    "data-affiliate-product-id": gift?.id || "",
    "data-affiliate-product-name": gift?.name || "",
    "data-affiliate-product-slug": slug || gift?.slug || "",
    "data-affiliate-asin": gift?.amazonAsin || gift?.asin || "",
  };
}
