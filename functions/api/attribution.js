import { classifyPath, empty, safeHost, sanitize } from "./_analytics.js";

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const source = sanitize(payload.source, 64).toLowerCase();
    const path = sanitize(payload.path, 256);
    const campaign = sanitize(payload.campaign, 128);
    const medium = sanitize(payload.medium, 64).toLowerCase();
    const referrer = sanitize(payload.referrer, 512);

    if (!source && !campaign) {
      return empty();
    }

    const pathMeta = classifyPath(path);

    const event = {
      event: "ai_referral",
      source,
      medium,
      campaign,
      path,
      pageType: pathMeta.pageType,
      pageSlug: sanitize(pathMeta.pageSlug, 160),
      referrerHost: safeHost(referrer),
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
