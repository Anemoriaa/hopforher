import {
  DEFAULT_DATE_PARTY_SIZE,
  DEFAULT_DATE_SPOT_LIMIT,
  DATE_SPOTS_PROVIDER_GOOGLE_PLACES,
  DATE_SPOTS_PROVIDER_OPENTABLE,
  buildDateSpotSearchUrl,
  buildFallbackDateSpots,
  deriveDateAreaLabel,
  extractDateSpotArray,
  getDateSpotPoweredLabel,
  getGooglePlacesSearchContext,
  normalizeDateSpot,
  resolveDateSpotProvider,
  sortGooglePlaceResults,
} from "../../apps/web/src/lib/date-spots.js";
import { translateUi } from "../../apps/web/src/lib/i18n.js";
import { getPreferredLocales } from "../../apps/web/src/lib/locale.js";

const GOOGLE_PLACES_SEARCH_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const DEFAULT_GOOGLE_PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours.openNow",
  "places.currentOpeningHours.nextOpenTime",
  "places.currentOpeningHours.nextCloseTime",
].join(",");

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

function getConfiguredProvider(env) {
  const explicit = String(env.DATE_SPOTS_PROVIDER || "").trim();

  if (explicit) {
    return resolveDateSpotProvider(explicit);
  }

  if (env.GOOGLE_PLACES_API_KEY) {
    return DATE_SPOTS_PROVIDER_GOOGLE_PLACES;
  }

  if (env.OPENTABLE_DIRECTORY_API_URL) {
    return DATE_SPOTS_PROVIDER_OPENTABLE;
  }

  return DATE_SPOTS_PROVIDER_GOOGLE_PLACES;
}

function buildFallbackResponse(search, provider, mode, note, areaLabel, status = 200) {
  return createJsonResponse(
    {
      ok: true,
      provider,
      mode,
      sourceLabel: getDateSpotPoweredLabel(provider),
      areaLabel,
      note,
      searchUrl: buildDateSpotSearchUrl(search, { provider }),
      spots: buildFallbackDateSpots(search, { provider }),
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

function getGooglePlacesLanguageCode(context) {
  const explicit = String(context.env.GOOGLE_PLACES_LANGUAGE_CODE || "").trim();

  if (explicit) {
    return explicit;
  }

  const header = context.request.headers.get("accept-language") || "";
  const requested = header.split(",")[0]?.trim();

  return requested || "en";
}

function getRequestLocales(context) {
  const header = context.request.headers.get("accept-language") || "";
  const requestedLocales = header
    .split(",")
    .map((value) => value.split(";")[0]?.trim())
    .filter(Boolean);

  return getPreferredLocales(requestedLocales);
}

function getGooglePlacesRegionCode(context) {
  const explicit = String(context.env.GOOGLE_PLACES_REGION_CODE || "").trim();

  if (explicit) {
    return explicit;
  }

  const header = context.request.headers.get("cf-ipcountry") || "";
  return /^[A-Z]{2}$/i.test(header) ? header.toUpperCase() : undefined;
}

function getGooglePlacesRankPreference(env) {
  const value = String(env.GOOGLE_PLACES_RANK_PREFERENCE || "POPULARITY")
    .trim()
    .toUpperCase();

  return value === "DISTANCE" ? "DISTANCE" : "POPULARITY";
}

function getGooglePlacesRadiusMeters(env) {
  return Math.min(
    50000,
    Math.max(500, Number(env.GOOGLE_PLACES_SEARCH_RADIUS_METERS) || 4000)
  );
}

function buildGooglePlacesSearchBody(search, context) {
  const { includedPrimaryTypes } = getGooglePlacesSearchContext(search);
  const body = {
    maxResultCount: search.limit,
    includedPrimaryTypes,
    rankPreference: getGooglePlacesRankPreference(context.env),
    locationRestriction: {
      circle: {
        center: {
          latitude: search.latitude,
          longitude: search.longitude,
        },
        radius: getGooglePlacesRadiusMeters(context.env),
      },
    },
    languageCode: getGooglePlacesLanguageCode(context),
  };
  const regionCode = getGooglePlacesRegionCode(context);

  if (regionCode) {
    body.regionCode = regionCode;
  }

  return body;
}

async function loadGooglePlacesResults(context, search, areaLabel) {
  const provider = DATE_SPOTS_PROVIDER_GOOGLE_PLACES;
  const locales = getRequestLocales(context);

  if (!context.env.GOOGLE_PLACES_API_KEY) {
    return buildFallbackResponse(
      search,
      provider,
      "unconfigured",
      translateUi("server.googleUnconfigured", locales),
      areaLabel
    );
  }

  if (search.latitude === null || search.longitude === null) {
    return buildFallbackResponse(
      search,
      provider,
      "idle",
      translateUi("server.locationRequired", locales),
      areaLabel
    );
  }

  try {
    const upstreamResponse = await fetchJsonWithTimeout(
      GOOGLE_PLACES_SEARCH_NEARBY_URL,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "X-Goog-Api-Key": context.env.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask": context.env.GOOGLE_PLACES_FIELD_MASK || DEFAULT_GOOGLE_PLACES_FIELD_MASK,
        },
        body: JSON.stringify(buildGooglePlacesSearchBody(search, context)),
        cf: { cacheTtl: 0, cacheEverything: false },
      }
    );

    if (!upstreamResponse.ok) {
      return buildFallbackResponse(
        search,
        provider,
        "fallback",
        translateUi("server.fallbackUnavailable", locales),
        areaLabel
      );
    }

    const payload = await upstreamResponse.json();
    const spots = sortGooglePlaceResults(extractDateSpotArray(payload), search)
      .map((spot, index) => normalizeDateSpot(spot, index, search, { provider, locales }))
      .filter(Boolean)
      .slice(0, search.limit);

    if (!spots.length) {
      return createJsonResponse({
        ok: true,
        provider,
        mode: "live",
        sourceLabel: getDateSpotPoweredLabel(provider),
        areaLabel: payload.areaLabel || deriveDateAreaLabel(spots, areaLabel),
        note: translateUi("server.noMatchesGoogle", locales),
        searchUrl: buildDateSpotSearchUrl(search, { provider }),
        spots: [],
      });
    }

    return createJsonResponse({
      ok: true,
      provider,
      mode: "live",
      sourceLabel: getDateSpotPoweredLabel(provider),
      areaLabel: payload.areaLabel || deriveDateAreaLabel(spots, areaLabel),
      note: payload.note || translateUi("server.googleLive", locales),
      searchUrl: buildDateSpotSearchUrl(search, { provider }),
      spots,
    });
  } catch (error) {
    const note =
      error?.name === "AbortError"
        ? translateUi("server.fallbackTimeout", locales)
        : translateUi("server.fallbackUnavailable", locales);

    return buildFallbackResponse(search, provider, "fallback", note, areaLabel);
  }
}

async function loadOpenTableResults(context, search, areaLabel) {
  const provider = DATE_SPOTS_PROVIDER_OPENTABLE;
  const upstreamUrl = context.env.OPENTABLE_DIRECTORY_API_URL;
  const locales = getRequestLocales(context);

  if (!upstreamUrl) {
    return buildFallbackResponse(
      search,
      provider,
      "unconfigured",
      translateUi("server.openTableUnconfigured", locales),
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
        provider,
        "fallback",
        translateUi("server.fallbackUnavailable", locales),
        areaLabel
      );
    }

    const payload = await upstreamResponse.json();
    const spots = extractDateSpotArray(payload)
      .map((spot, index) => normalizeDateSpot(spot, index, search, { provider, locales }))
      .filter(Boolean)
      .slice(0, search.limit);

    if (!spots.length) {
      return createJsonResponse({
        ok: true,
        provider,
        mode: "live",
        sourceLabel: getDateSpotPoweredLabel(provider),
        areaLabel: payload.areaLabel || payload.locationLabel || areaLabel,
        note: translateUi("server.noMatchesOpenTable", locales),
        searchUrl: buildDateSpotSearchUrl(search, { provider }),
        spots: [],
      });
    }

    return createJsonResponse({
      ok: true,
      provider,
      mode: "live",
      sourceLabel: getDateSpotPoweredLabel(provider),
      areaLabel: payload.areaLabel || payload.locationLabel || deriveDateAreaLabel(spots, areaLabel),
      note: payload.note || translateUi("server.openTableLive", locales),
      searchUrl: buildDateSpotSearchUrl(search, { provider }),
      spots,
    });
  } catch (error) {
    const note =
      error?.name === "AbortError"
        ? translateUi("server.fallbackTimeout", locales)
        : translateUi("server.fallbackUnavailable", locales);

    return buildFallbackResponse(search, provider, "fallback", note, areaLabel);
  }
}

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const search = getSearchParams(requestUrl);
  const areaLabel = search.latitude !== null && search.longitude !== null ? "Near you" : "Preview area";
  const provider = getConfiguredProvider(context.env);

  if (provider === DATE_SPOTS_PROVIDER_OPENTABLE) {
    return loadOpenTableResults(context, search, areaLabel);
  }

  return loadGooglePlacesResults(context, search, areaLabel);
}
