export const DEFAULT_DATE_PARTY_SIZE = 2;
export const DEFAULT_DATE_SPOT_LIMIT = 6;

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

function normalizePriceHint(raw) {
  const direct = pickPath(raw, ["priceHint", "price", "priceRange", "priceLevel"]);

  if (typeof direct === "string") {
    return direct;
  }

  const level = toNumber(direct);

  if (!level) {
    return null;
  }

  return "$".repeat(Math.max(1, Math.min(4, Math.round(level))));
}

function normalizeRatingLabel(raw) {
  const rating = toNumber(pickPath(raw, ["rating", "aggregateRating", "ratingValue", "reviews.average"]));

  if (!rating) {
    return null;
  }

  return `${rating.toFixed(1)} star`;
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

export function buildFallbackDateSpots(search = {}) {
  return fallbackDateSpotTemplates.map((spot) => ({
    ...spot,
    id: `fallback-${spot.id}`,
    cuisine: null,
    priceHint: null,
    ratingLabel: null,
    distanceMiles: null,
    distanceLabel: null,
    availabilityLabel: "Search live availability in OpenTable",
    nextSlots: [],
    bookingUrl: buildOpenTableNearbyUrl(search),
    actionLabel: "Search",
    sourceLabel: "OpenTable",
  }));
}

export function extractDateSpotArray(rawPayload) {
  if (Array.isArray(rawPayload)) {
    return rawPayload;
  }

  const candidates = [
    rawPayload?.restaurants,
    rawPayload?.results,
    rawPayload?.venues,
    rawPayload?.items,
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

export function normalizeDateSpot(raw, index, search = {}) {
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
    actionLabel: "Book",
    sourceLabel: "OpenTable",
  };
}
