export const AMAZON_ASSOCIATE_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";
export const AMAZON_PAID_LINK_NOTE = "Paid link to Amazon";
export const DIRECT_MERCHANT_LINK_NOTE = "Direct merchant link";
export const AMAZON_AFFILIATE_REL = "nofollow sponsored noopener noreferrer";

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

export function resolveGiftMerchantName(gift, fallbackMerchant = "Amazon") {
  return gift?.merchantName || fallbackMerchant;
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
