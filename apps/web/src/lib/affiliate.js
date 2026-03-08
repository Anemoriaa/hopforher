export const AMAZON_ASSOCIATE_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";
export const AMAZON_PAID_LINK_NOTE = "Paid link to Amazon";
export const AMAZON_AFFILIATE_REL = "nofollow sponsored noopener noreferrer";

export function buildAffiliateDataAttributes({ gift, placement = "unknown", merchant = "Amazon", slug = "" } = {}) {
  return {
    "data-affiliate-link": "amazon",
    "data-affiliate-merchant": merchant,
    "data-affiliate-placement": placement,
    "data-affiliate-product-id": gift?.id || "",
    "data-affiliate-product-name": gift?.name || "",
    "data-affiliate-product-slug": slug || gift?.slug || "",
    "data-affiliate-asin": gift?.amazonAsin || gift?.asin || "",
  };
}
