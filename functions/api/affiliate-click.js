import {
  classifyPath,
  empty,
  extractAmazonAsin,
  safeHost,
  safePathFromUrl,
  sanitize,
} from "./_analytics.js";

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const destination = sanitize(payload.destination, 1024);
    const path = sanitize(payload.path, 256);

    if (!destination || !path) {
      return empty();
    }

    const pathMeta = classifyPath(path);
    const event = {
      event: "affiliate_click",
      merchant: sanitize(payload.merchant, 64) || "Amazon",
      placement: sanitize(payload.placement, 64),
      productId: sanitize(payload.productId, 96),
      productSlug: sanitize(payload.productSlug, 160),
      productName: sanitize(payload.productName, 160),
      asin: sanitize(payload.asin, 32) || extractAmazonAsin(destination),
      tag: sanitize(payload.tag, 96),
      buttonLabel: sanitize(payload.buttonLabel, 80),
      pageTitle: sanitize(payload.pageTitle, 160),
      path,
      pageType: pathMeta.pageType,
      pageSlug: sanitize(pathMeta.pageSlug, 160),
      source: sanitize(payload.source, 64).toLowerCase(),
      medium: sanitize(payload.medium, 64).toLowerCase(),
      campaign: sanitize(payload.campaign, 128),
      referrerHost: sanitize(payload.referrerHost, 128) || safeHost(payload.referrer),
      destinationHost: safeHost(destination),
      destinationPath: safePathFromUrl(destination),
      userAgent: sanitize(context.request.headers.get("user-agent"), 256),
      country: sanitize(context.request.headers.get("cf-ipcountry"), 8),
      capturedAt: sanitize(payload.capturedAt, 64) || new Date().toISOString(),
    };

    console.log(JSON.stringify(event));
    return empty();
  } catch (_error) {
    return empty();
  }
}

export function onRequestGet() {
  return empty(405);
}
