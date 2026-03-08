export function empty(status = 204) {
  return new Response(null, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export function sanitize(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

export function safeHost(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch (_error) {
    return "";
  }
}

export function classifyPath(value) {
  const raw = String(value || "").trim();
  const normalized = raw.split("?")[0].replace(/\/+$/, "") || "/";

  if (normalized === "/") {
    return { pageType: "home", pageSlug: "" };
  }

  const trustPages = new Map([
    ["/about.html", "about"],
    ["/contact.html", "contact"],
    ["/editorial-policy.html", "editorial-policy"],
    ["/privacy.html", "privacy"],
    ["/terms.html", "terms"],
    ["/affiliate-disclosure.html", "affiliate-disclosure"],
    ["/site-map.html", "site-map"],
  ]);

  if (trustPages.has(normalized)) {
    return { pageType: "trust", pageSlug: trustPages.get(normalized) };
  }

  if (normalized === "/guides") {
    return { pageType: "guide-index", pageSlug: "" };
  }

  if (normalized === "/hot") {
    return { pageType: "hot-index", pageSlug: "" };
  }

  if (normalized === "/dates") {
    return { pageType: "dates-index", pageSlug: "" };
  }

  if (normalized.startsWith("/gift/")) {
    return { pageType: "product", pageSlug: normalized.slice("/gift/".length) };
  }

  if (normalized.startsWith("/hot/")) {
    return { pageType: "hot-story", pageSlug: normalized.slice("/hot/".length) };
  }

  if (normalized.startsWith("/dates/")) {
    return { pageType: "date-city", pageSlug: normalized.slice("/dates/".length) };
  }

  return { pageType: "guide", pageSlug: normalized.slice(1) };
}

export function safeUrl(value) {
  try {
    return new URL(String(value || ""));
  } catch (_error) {
    return null;
  }
}

export function extractAmazonAsin(value) {
  const url = safeUrl(value);

  if (!url) {
    return "";
  }

  const match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match ? match[1].toUpperCase() : "";
}

export function safePathFromUrl(value, maxLength = 256) {
  const url = safeUrl(value);
  return url ? sanitize(url.pathname, maxLength) : "";
}
