export const DEFAULT_DATE_PARTY_SIZE = 2;
export const DEFAULT_DATE_SPOT_LIMIT = 6;
export const DATE_SPOTS_PROVIDER_GOOGLE_PLACES = "google-places";
export const DATE_SPOTS_PROVIDER_OPENTABLE = "opentable";
export const DEFAULT_DATE_SPOTS_PROVIDER = DATE_SPOTS_PROVIDER_GOOGLE_PLACES;

const fallbackDateSpotTemplates = [
  {
    id: "quiet-neighborhood",
    name: "Quiet neighborhood dinner",
    type: "Dinner",
    neighborhood: "Conversation-first",
    description: "Low-noise dinner rooms tend to be the safest first answer when you want the plan to feel handled.",
    vibe: "Easy conversation",
  },
  {
    id: "natural-wine",
    name: "Natural wine bar",
    type: "Drinks",
    neighborhood: "Low-pressure",
    description: "A shorter wine bar plan works when you want something polished that is still easy to say yes to.",
    vibe: "Short and polished",
  },
  {
    id: "rooftop-room",
    name: "Rooftop dinner room",
    type: "Night out",
    neighborhood: "Higher payoff",
    description: "Use the stronger visual option when you want a little more payoff without overcomplicating the night.",
    vibe: "Looks strong",
  },
  {
    id: "dessert-cocktail",
    name: "Dessert and cocktail stop",
    type: "After dinner",
    neighborhood: "Easy add-on",
    description: "A second stop works better when it is short, nearby, and does not turn into a whole new itinerary.",
    vibe: "Easy second move",
  },
  {
    id: "weekend-brunch",
    name: "Weekend brunch room",
    type: "Day date",
    neighborhood: "Daytime option",
    description: "Brunch is cleaner than dinner when you want something intentional but lighter and easier to schedule.",
    vibe: "Easy daytime",
  },
  {
    id: "hotel-bar",
    name: "Hotel bar fallback",
    type: "Safe pick",
    neighborhood: "Reliable room",
    description: "A strong hotel bar can be a better choice than a random trendy place when reliability matters more than novelty.",
    vibe: "Zero drama",
  },
];

const dateSummaryFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateTimeLocalInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toOpenTableDateTime(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function getPathValue(source, path) {
  return path.split(".").reduce((current, key) => {
    if (current == null) {
      return undefined;
    }

    return current[key];
  }, source);
}

function pickPath(source, paths) {
  for (const path of paths) {
    const value = getPathValue(source, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function humanizeToken(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveDateSpotProvider(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "google" || normalized === "google_places" || normalized === DATE_SPOTS_PROVIDER_GOOGLE_PLACES) {
    return DATE_SPOTS_PROVIDER_GOOGLE_PLACES;
  }

  if (normalized === DATE_SPOTS_PROVIDER_OPENTABLE) {
    return DATE_SPOTS_PROVIDER_OPENTABLE;
  }

  return DEFAULT_DATE_SPOTS_PROVIDER;
}

function inferDateSpotProvider(raw, explicitProvider) {
  if (explicitProvider) {
    return resolveDateSpotProvider(explicitProvider);
  }

  if (pickPath(raw, ["displayName.text", "googleMapsUri", "primaryTypeDisplayName.text", "location.latitude"])) {
    return DATE_SPOTS_PROVIDER_GOOGLE_PLACES;
  }

  return DATE_SPOTS_PROVIDER_OPENTABLE;
}

export function getDateSpotPoweredLabel(provider) {
  return resolveDateSpotProvider(provider) === DATE_SPOTS_PROVIDER_OPENTABLE
    ? "Powered by OpenTable"
    : "Powered by Google Places";
}

export function getDateSpotSourceLabel(provider) {
  return resolveDateSpotProvider(provider) === DATE_SPOTS_PROVIDER_OPENTABLE ? "OpenTable" : "Google Places";
}

export function getDateSpotSearchLinkLabel(provider) {
  return resolveDateSpotProvider(provider) === DATE_SPOTS_PROVIDER_OPENTABLE ? "Open OpenTable" : "Open in Maps";
}

export function getGooglePlacesSearchContext(search = {}) {
  const parsed = new Date(search.dateTime);
  const hour = Number.isNaN(parsed.getTime()) ? 19 : parsed.getHours();

  if (hour >= 23 || hour < 5) {
    return {
      includedPrimaryTypes: ["bar", "restaurant"],
      preferredTypes: ["cocktail_bar", "wine_bar", "bar", "restaurant", "lounge"],
      demotedTypes: ["sandwich_shop", "fast_food_restaurant", "hamburger_restaurant", "ice_cream_shop"],
      searchQuery: "late night drinks and dinner",
    };
  }

  if (hour < 11) {
    return {
      includedPrimaryTypes: ["cafe", "restaurant"],
      preferredTypes: ["coffee_shop", "cafe", "breakfast_restaurant", "brunch_restaurant", "restaurant"],
      demotedTypes: ["bar", "night_club", "hamburger_restaurant", "sandwich_shop"],
      searchQuery: "coffee and brunch date spots",
    };
  }

  if (hour < 16) {
    return {
      includedPrimaryTypes: ["restaurant", "cafe"],
      preferredTypes: ["restaurant", "brunch_restaurant", "cafe", "coffee_shop"],
      demotedTypes: ["fast_food_restaurant", "hamburger_restaurant", "sandwich_shop"],
      searchQuery: "brunch and lunch date spots",
    };
  }

  if (hour < 22) {
    return {
      includedPrimaryTypes: ["restaurant", "bar"],
      preferredTypes: [
        "restaurant",
        "wine_bar",
        "cocktail_bar",
        "french_restaurant",
        "italian_restaurant",
        "japanese_restaurant",
        "mediterranean_restaurant",
        "steak_house",
        "seafood_restaurant",
      ],
      demotedTypes: ["sandwich_shop", "fast_food_restaurant", "hamburger_restaurant", "chicken_restaurant"],
      searchQuery: "date night restaurants and cocktail bars",
    };
  }

  return {
    includedPrimaryTypes: ["bar", "restaurant"],
    preferredTypes: ["cocktail_bar", "wine_bar", "bar", "restaurant", "lounge"],
    demotedTypes: ["sandwich_shop", "fast_food_restaurant", "hamburger_restaurant", "ice_cream_shop"],
    searchQuery: "cocktail bars and dinner spots",
  };
}

function buildGoogleMapsPlaceUrl({ placeId, name, address }) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", [name, address].filter(Boolean).join(", ") || "date night restaurants");

  if (placeId) {
    url.searchParams.set("query_place_id", String(placeId));
  }

  return url.toString();
}

export function buildGoogleMapsNearbyUrl(search = {}) {
  const { searchQuery } = getGooglePlacesSearchContext(search);
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", searchQuery);
  return url.toString();
}

export function buildOpenTableNearbyUrl(search = {}) {
  const target = search.bookingUrl || "https://www.opentable.com/nearby";
  const url = new URL(target, "https://www.opentable.com");

  if (search.partySize) {
    url.searchParams.set("covers", String(search.partySize));
  }

  if (search.dateTime) {
    url.searchParams.set("dateTime", toOpenTableDateTime(search.dateTime));
  }

  if (search.latitude !== null && search.latitude !== undefined) {
    url.searchParams.set("latitude", String(search.latitude));
  }

  if (search.longitude !== null && search.longitude !== undefined) {
    url.searchParams.set("longitude", String(search.longitude));
  }

  return url.toString();
}

export function buildDateSpotSearchUrl(search = {}, options = {}) {
  const provider = resolveDateSpotProvider(options.provider || search.provider);

  if (provider === DATE_SPOTS_PROVIDER_OPENTABLE) {
    return buildOpenTableNearbyUrl(search);
  }

  return buildGoogleMapsNearbyUrl(search);
}

function normalizePriceHint(raw) {
  const direct = pickPath(raw, ["priceHint", "price", "priceRange", "priceLevel"]);

  if (typeof direct === "string") {
    if (/^PRICE_LEVEL_/i.test(direct)) {
      const level = direct.replace(/^PRICE_LEVEL_/i, "").toUpperCase();
      const priceLevelMap = {
        FREE: "$",
        INEXPENSIVE: "$",
        MODERATE: "$$",
        EXPENSIVE: "$$$",
        VERY_EXPENSIVE: "$$$$",
      };

      return priceLevelMap[level] || null;
    }

    return direct;
  }

  const level = toNumber(direct);

  if (!level) {
    return null;
  }

  return "$".repeat(Math.max(1, Math.min(4, Math.round(level))));
}

function formatCompactCount(value) {
  const count = toNumber(value);

  if (!count) {
    return null;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }

  return String(Math.round(count));
}

function normalizeRatingLabel(raw) {
  const rating = toNumber(pickPath(raw, ["rating", "aggregateRating", "ratingValue", "reviews.average"]));
  const reviewCount = formatCompactCount(pickPath(raw, ["userRatingCount", "reviews.count", "reviewCount"]));

  if (!rating) {
    return null;
  }

  return reviewCount ? `${rating.toFixed(1)} stars · ${reviewCount} reviews` : `${rating.toFixed(1)} stars`;
}

function normalizeTimeLabel(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) {
    return value;
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return timeFormatter.format(parsed);
  }

  return String(value);
}

function normalizeNextSlots(raw) {
  const candidates = [
    pickPath(raw, ["nextSlots", "availableTimes", "times", "availability.times", "availability.slots", "booking.nextSlots"]),
  ].flat().filter(Boolean);

  if (!candidates.length) {
    return [];
  }

  const values = Array.isArray(candidates[0]) ? candidates[0] : candidates;

  return values
    .map((value) => {
      if (typeof value === "string") {
        return normalizeTimeLabel(value);
      }

      return normalizeTimeLabel(
        pickPath(value, ["label", "time", "startTime", "dateTime", "datetime", "start"])
      );
    })
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3);
}

function haversineMiles(latitudeA, longitudeA, latitudeB, longitudeB) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(latitudeB - latitudeA);
  const lngDelta = toRadians(longitudeB - longitudeA);
  const originLat = toRadians(latitudeA);
  const targetLat = toRadians(latitudeB);

  const step =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMiles * (2 * Math.atan2(Math.sqrt(step), Math.sqrt(1 - step)));
}

function resolveDistanceMiles(raw, search) {
  const directDistance = toNumber(
    pickPath(raw, ["distanceMiles", "distance_miles", "distance", "distanceInMiles", "proximity.distance"])
  );

  if (directDistance !== null) {
    const unit = pickPath(raw, ["distanceUnit", "distance_unit", "proximity.unit"]);

    if (typeof unit === "string" && unit.toLowerCase().startsWith("km")) {
      return directDistance * 0.621371;
    }

    return directDistance;
  }

  if (search.latitude === null || search.longitude === null) {
    return null;
  }

  const latitude = toNumber(pickPath(raw, ["latitude", "lat", "location.latitude", "coordinates.latitude"]));
  const longitude = toNumber(pickPath(raw, ["longitude", "lng", "lon", "location.longitude", "coordinates.longitude"]));

  if (latitude === null || longitude === null) {
    return null;
  }

  return haversineMiles(search.latitude, search.longitude, latitude, longitude);
}

function resolveGoogleOpenStatus(raw) {
  const openNow = pickPath(raw, ["currentOpeningHours.openNow", "regularOpeningHours.openNow"]);

  if (openNow === true) {
    return "Open now";
  }

  if (openNow === false) {
    return "Closed right now";
  }

  return null;
}

function formatHoursTransitionLabel(prefix, value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return `${prefix} ${timeFormatter.format(parsed)}`;
}

function parseAddressSegments(value) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getGoogleAddressMeta(raw) {
  const shortAddress = pickPath(raw, ["shortFormattedAddress", "vicinity"]);
  const formattedAddress = pickPath(raw, ["formattedAddress"]);
  const shortSegments = parseAddressSegments(shortAddress);
  const fullSegments = parseAddressSegments(formattedAddress);
  const city =
    shortSegments.length >= 2
      ? shortSegments[shortSegments.length - 1]
      : fullSegments.length >= 2
        ? fullSegments[fullSegments.length - 2]
        : null;
  const regionSource = fullSegments[fullSegments.length - 1] || "";
  const region = regionSource.match(/\b([A-Z]{2})\b/)?.[1] || null;

  return {
    addressLine: shortAddress || formattedAddress || null,
    formattedAddress: formattedAddress || shortAddress || null,
    city,
    region,
  };
}

function buildGoogleDescription(raw, addressLine) {
  const explicit = pickPath(raw, ["editorialSummary.text", "description", "summary"]);

  if (explicit) {
    return explicit;
  }

  const openStatus = resolveGoogleOpenStatus(raw);

  return [addressLine, openStatus].filter(Boolean).join(" · ") || "Open place details in Google Maps.";
}

function resolveGoogleAvailabilityLabel(raw, websiteUrl) {
  const openStatus = resolveGoogleOpenStatus(raw);
  const nextClose = formatHoursTransitionLabel("Closes", pickPath(raw, ["currentOpeningHours.nextCloseTime"]));
  const nextOpen = formatHoursTransitionLabel("Opens", pickPath(raw, ["currentOpeningHours.nextOpenTime"]));

  if (openStatus === "Open now") {
    return [openStatus, nextClose].filter(Boolean).join(" · ");
  }

  if (openStatus === "Closed right now") {
    return [openStatus, nextOpen].filter(Boolean).join(" · ");
  }

  return websiteUrl ? "Visit the venue site for hours." : "Open place details in Google Maps.";
}

function getGoogleSpotName(raw) {
  const displayName = pickPath(raw, ["displayName.text", "displayName", "title"]);

  if (displayName) {
    return displayName;
  }

  const fallbackName = pickPath(raw, ["name"]);

  if (typeof fallbackName === "string" && !fallbackName.startsWith("places/")) {
    return fallbackName;
  }

  return null;
}

function toPriceLevelScore(value) {
  if (typeof value === "string" && /^PRICE_LEVEL_/i.test(value)) {
    const normalized = value.replace(/^PRICE_LEVEL_/i, "").toUpperCase();
    const priceLevelMap = {
      FREE: 1,
      INEXPENSIVE: 1,
      MODERATE: 2,
      EXPENSIVE: 3,
      VERY_EXPENSIVE: 4,
    };

    return priceLevelMap[normalized] || 0;
  }

  return toNumber(value) || 0;
}

function scoreGooglePlaceResult(raw, search = {}) {
  const primaryType = String(pickPath(raw, ["primaryType"]) || "");
  const { preferredTypes = [], demotedTypes = [] } = getGooglePlacesSearchContext(search);
  const preferred = new Set(preferredTypes);
  const demoted = new Set(demotedTypes);
  const parsed = new Date(search.dateTime);
  const hour = Number.isNaN(parsed.getTime()) ? 19 : parsed.getHours();
  const rating = toNumber(pickPath(raw, ["rating"]));
  const reviewCount = toNumber(pickPath(raw, ["userRatingCount"]));
  const priceLevel = toPriceLevelScore(pickPath(raw, ["priceLevel"]));
  const openNow = pickPath(raw, ["currentOpeningHours.openNow"]);
  let score = 0;

  if (preferred.has(primaryType)) {
    score += 12;
  }

  if (demoted.has(primaryType)) {
    score -= 12;
  }

  if (primaryType === "restaurant") {
    score += 4;
  }

  if (primaryType.endsWith("_restaurant")) {
    score += 2;
  }

  if ((primaryType === "bar" || primaryType.endsWith("_bar")) && hour >= 16) {
    score += 3;
  }

  if (rating !== null) {
    score += Math.max(0, (rating - 4) * 4);
  }

  if (reviewCount) {
    score += Math.min(4, Math.log10(reviewCount + 1));
  }

  if (priceLevel >= 2 && priceLevel <= 3 && hour >= 16) {
    score += 1.5;
  }

  if (pickPath(raw, ["websiteUri"])) {
    score += 1.5;
  }

  if (openNow === true) {
    score += 1.5;
  }

  if (openNow === false) {
    score -= 4;
  }

  return score;
}

export function sortGooglePlaceResults(rawPlaces, search = {}) {
  return [...rawPlaces]
    .sort((placeA, placeB) => scoreGooglePlaceResult(placeB, search) - scoreGooglePlaceResult(placeA, search))
    .filter((place, index, array) => {
      const placeId = pickPath(place, ["id"]) || getGoogleSpotName(place);

      if (!placeId) {
        return true;
      }

      return array.findIndex((candidate) => (pickPath(candidate, ["id"]) || getGoogleSpotName(candidate)) === placeId) === index;
    });
}

function normalizeGoogleDateSpot(raw, index, search = {}) {
  const name = getGoogleSpotName(raw);

  if (!name) {
    return null;
  }

  const addressMeta = getGoogleAddressMeta(raw);
  const addressLine = addressMeta.addressLine;
  const type =
    pickPath(raw, ["primaryTypeDisplayName.text", "category"]) ||
    humanizeToken(pickPath(raw, ["primaryType", "types.0"]) || "date spot");
  const mapUrl =
    pickPath(raw, ["googleMapsUri"]) ||
    buildGoogleMapsPlaceUrl({
      placeId: pickPath(raw, ["id"]),
      name,
      address: addressLine,
    });
  const websiteUrl = pickPath(raw, ["websiteUri"]);
  const distanceMiles = resolveDistanceMiles(raw, search);

  return {
    id: String(pickPath(raw, ["id"]) || `${slugify(name)}-${index}`),
    name,
    type,
    description: buildGoogleDescription(raw, addressMeta.formattedAddress || addressLine),
    neighborhood: addressMeta.city || addressLine,
    city: addressMeta.city || pickPath(raw, ["city", "location.city", "address.city"]),
    region: addressMeta.region || pickPath(raw, ["region", "state", "location.region", "address.state"]),
    cuisine: null,
    vibe: null,
    priceHint: normalizePriceHint(raw),
    ratingLabel: normalizeRatingLabel(raw),
    distanceMiles,
    distanceLabel: formatDistanceMiles(distanceMiles),
    availabilityLabel: resolveGoogleAvailabilityLabel(raw, websiteUrl),
    nextSlots: [],
    bookingUrl: websiteUrl || mapUrl,
    mapUrl,
    websiteUrl,
    actionLabel: websiteUrl ? "Visit site" : "Open in Maps",
    sourceLabel: getDateSpotSourceLabel(DATE_SPOTS_PROVIDER_GOOGLE_PLACES),
  };
}

function normalizeOpenTableDateSpot(raw, index, search = {}) {
  const name = pickPath(raw, ["name", "restaurantName", "restaurant.name", "title"]);

  if (!name) {
    return null;
  }

  const city = pickPath(raw, ["city", "location.city", "address.city"]);
  const region = pickPath(raw, ["region", "state", "location.region", "address.state"]);
  const type = pickPath(raw, ["type", "diningStyle", "reservationType", "category"]) || "Date spot";
  const neighborhood = pickPath(raw, ["neighborhood", "area", "district", "location.neighborhood", "address.neighborhood"]) || city;
  const cuisine = pickPath(raw, ["cuisine", "cuisines", "primaryCuisine", "metadata.cuisine"]);
  const vibe = pickPath(raw, ["vibe", "metadata.vibe"]);
  const description =
    pickPath(raw, ["description", "summary", "shortDescription", "editorialSummary"]) ||
    [cuisine, vibe].filter(Boolean).join(" · ") ||
    "Open in OpenTable for live availability.";
  const nextSlots = normalizeNextSlots(raw);
  const bookingUrl = buildOpenTableNearbyUrl({
    bookingUrl: pickPath(raw, ["bookingUrl", "reservationUrl", "reserveUrl", "url", "link", "restaurant.url", "links.booking"]),
    partySize: search.partySize,
    dateTime: search.dateTime,
    latitude: search.latitude,
    longitude: search.longitude,
  });
  const distanceMiles = resolveDistanceMiles(raw, search);

  return {
    id: String(pickPath(raw, ["id", "restaurantId", "rid"]) || `${slugify(name)}-${index}`),
    name,
    type,
    description,
    neighborhood,
    city,
    region,
    cuisine: Array.isArray(cuisine) ? cuisine.join(", ") : cuisine,
    vibe,
    priceHint: normalizePriceHint(raw),
    ratingLabel: normalizeRatingLabel(raw),
    distanceMiles,
    distanceLabel: formatDistanceMiles(distanceMiles),
    availabilityLabel:
      pickPath(raw, ["availabilityLabel", "availability.summary", "availability.status", "bookingSummary", "status"]) ||
      (nextSlots.length ? `Next ${nextSlots[0]}` : "Check live availability in OpenTable"),
    nextSlots,
    bookingUrl,
    mapUrl: null,
    websiteUrl: null,
    actionLabel: "Book",
    sourceLabel: getDateSpotSourceLabel(DATE_SPOTS_PROVIDER_OPENTABLE),
  };
}

export function getDefaultDateTimeInput(baseDate = new Date()) {
  const next = new Date(baseDate);
  next.setMinutes(next.getMinutes() + 120);
  next.setSeconds(0, 0);

  const roundedMinutes = Math.ceil(next.getMinutes() / 30) * 30;

  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else {
    next.setMinutes(roundedMinutes, 0, 0);
  }

  return toDateTimeLocalInput(next);
}

export function formatDateTimeSummary(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Tonight";
  }

  return dateSummaryFormatter.format(parsed);
}

export function formatDistanceMiles(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const rounded = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  return `${rounded} mi`;
}

export function buildFallbackDateSpots(search = {}, options = {}) {
  const provider = resolveDateSpotProvider(options.provider);
  const sourceLabel = getDateSpotSourceLabel(provider);
  const searchUrl = buildDateSpotSearchUrl(search, { provider });
  const actionLabel = provider === DATE_SPOTS_PROVIDER_OPENTABLE ? "Search" : "Open in Maps";
  const availabilityLabel =
    provider === DATE_SPOTS_PROVIDER_OPENTABLE
      ? "Search live availability in OpenTable"
      : "Open place details in Google Maps";

  return fallbackDateSpotTemplates.map((spot) => ({
    ...spot,
    id: `fallback-${spot.id}`,
    cuisine: null,
    priceHint: null,
    ratingLabel: null,
    distanceMiles: null,
    distanceLabel: null,
    availabilityLabel,
    nextSlots: [],
    bookingUrl: searchUrl,
    mapUrl: provider === DATE_SPOTS_PROVIDER_GOOGLE_PLACES ? searchUrl : null,
    websiteUrl: null,
    actionLabel,
    sourceLabel,
  }));
}

export function extractDateSpotArray(rawPayload) {
  if (Array.isArray(rawPayload)) {
    return rawPayload;
  }

  const candidates = [
    rawPayload?.places,
    rawPayload?.restaurants,
    rawPayload?.results,
    rawPayload?.venues,
    rawPayload?.items,
    rawPayload?.data?.places,
    rawPayload?.data?.restaurants,
    rawPayload?.data?.results,
    rawPayload?.data?.venues,
    rawPayload?.data?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

export function deriveDateAreaLabel(spots, fallbackLabel = "Near you") {
  const firstSpot = spots[0];

  if (!firstSpot) {
    return fallbackLabel;
  }

  const area = [firstSpot.city, firstSpot.region].filter(Boolean).join(", ");

  if (area) {
    return area;
  }

  return firstSpot.neighborhood || fallbackLabel;
}

export function normalizeDateSpot(raw, index, search = {}, options = {}) {
  const provider = inferDateSpotProvider(raw, options.provider);

  if (provider === DATE_SPOTS_PROVIDER_OPENTABLE) {
    return normalizeOpenTableDateSpot(raw, index, search);
  }

  return normalizeGoogleDateSpot(raw, index, search);
}
