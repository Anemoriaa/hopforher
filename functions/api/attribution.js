function empty(status = 204) {
  return new Response(null, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function sanitize(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function safeHost(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch (_error) {
    return "";
  }
}

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

    const event = {
      event: "ai_referral",
      source,
      medium,
      campaign,
      path,
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
