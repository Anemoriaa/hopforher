import {
  DEFAULT_DATE_PARTY_SIZE,
  DEFAULT_DATE_SPOT_LIMIT,
  buildFallbackDateSpots,
  buildOpenTableNearbyUrl,
  deriveDateAreaLabel,
  extractDateSpotArray,
  normalizeDateSpot,
} from "../../apps/web/src/lib/date-spots.js";

function createJsonResponse(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getSearchParams(url) {
  const latitude = toNumber(url.searchParams.get("latitude"));
  const longitude = toNumber(url.searchParams.get("longitude"));
  const partySize = Math.min(
    12,
    Math.max(1, Number(url.searchParams.get("partySize")) || DEFAULT_DATE_PARTY_SIZE)
  );
  const limit = Math.min(
    12,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_DATE_SPOT_LIMIT)
  );

  return {
    latitude,
    longitude,
    partySize,
    limit,
    dateTime: url.searchParams.get("dateTime") || "",
  };
}

function applyQueryParam(url, key, value) {
  if (!key || value === null || value === undefined || value === "") {
    return;
  }

  url.searchParams.set(key, String(value));
}

function buildFallbackResponse(search, mode, note, areaLabel, status = 200) {
  return createJsonResponse(
    {
      ok: true,
      mode,
      sourceLabel: "Powered by OpenTable",
      areaLabel,
      note,
      searchUrl: buildOpenTableNearbyUrl(search),
      spots: buildFallbackDateSpots(search),
    },
    { status }
  );
}

async function fetchJsonWithTimeout(resource, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const search = getSearchParams(requestUrl);
  const areaLabel = search.latitude !== null && search.longitude !== null ? "Near you" : "Preview area";
  const upstreamUrl = context.env.OPENTABLE_DIRECTORY_API_URL;

  if (!upstreamUrl) {
    return buildFallbackResponse(
      search,
      "unconfigured",
      "Add OPENTABLE_DIRECTORY_API_URL and partner credentials in Cloudflare Pages to load live nearby results.",
      areaLabel
    );
  }

  try {
    const targetUrl = new URL(upstreamUrl);
    const headers = new Headers({
      accept: "application/json",
    });

    applyQueryParam(targetUrl, context.env.OPENTABLE_LAT_PARAM || "latitude", search.latitude);
    applyQueryParam(targetUrl, context.env.OPENTABLE_LNG_PARAM || "longitude", search.longitude);
    applyQueryParam(targetUrl, context.env.OPENTABLE_PARTY_SIZE_PARAM || "partySize", search.partySize);
    applyQueryParam(targetUrl, context.env.OPENTABLE_DATETIME_PARAM || "dateTime", search.dateTime);
    applyQueryParam(targetUrl, context.env.OPENTABLE_LIMIT_PARAM || "limit", search.limit);

    if (context.env.OPENTABLE_API_KEY) {
      headers.set(context.env.OPENTABLE_API_KEY_HEADER || "x-api-key", context.env.OPENTABLE_API_KEY);
    }

    if (context.env.OPENTABLE_BEARER_TOKEN) {
      headers.set("authorization", `Bearer ${context.env.OPENTABLE_BEARER_TOKEN}`);
    }

    const upstreamResponse = await fetchJsonWithTimeout(targetUrl.toString(), {
      headers,
      cf: { cacheTtl: 0, cacheEverything: false },
    });

    if (!upstreamResponse.ok) {
      return buildFallbackResponse(
        search,
        "fallback",
        `OpenTable returned ${upstreamResponse.status}. Showing fallback date lanes instead.`,
        areaLabel
      );
    }

    const payload = await upstreamResponse.json();
    const spots = extractDateSpotArray(payload)
      .map((spot, index) => normalizeDateSpot(spot, index, search))
      .filter(Boolean)
      .slice(0, search.limit);

    if (!spots.length) {
      return createJsonResponse({
        ok: true,
        mode: "live",
        sourceLabel: "Powered by OpenTable",
        areaLabel: payload.areaLabel || payload.locationLabel || areaLabel,
        note: "No nearby matches came back for this time. Try a different time or party size.",
        searchUrl: buildOpenTableNearbyUrl(search),
        spots: [],
      });
    }

    return createJsonResponse({
      ok: true,
      mode: "live",
      sourceLabel: "Powered by OpenTable",
      areaLabel: payload.areaLabel || payload.locationLabel || deriveDateAreaLabel(spots, areaLabel),
      note: payload.note || "Nearby results are coming from the configured OpenTable feed.",
      searchUrl: buildOpenTableNearbyUrl(search),
      spots,
    });
  } catch (error) {
    const note =
      error?.name === "AbortError"
        ? "OpenTable timed out while loading nearby spots. Showing fallback date lanes instead."
        : "Could not load live nearby results from OpenTable. Showing fallback date lanes instead.";

    return buildFallbackResponse(search, "fallback", note, areaLabel);
  }
}
