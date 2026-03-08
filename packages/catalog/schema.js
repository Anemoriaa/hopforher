const accentPairs = [
  { from: "#c6dcff", to: "#35689e" },
  { from: "#bad7ff", to: "#2f6599" },
  { from: "#d0e3ff", to: "#4b78aa" },
  { from: "#c7ddff", to: "#3c6b9b" },
  { from: "#d6e7ff", to: "#5b82ad" },
];

function normalizeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeList(values, fallback = []) {
  if (!Array.isArray(values)) {
    return fallback;
  }

  const normalized = values
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return normalized.length ? [...new Set(normalized)] : fallback;
}

function normalizeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeUrlList(values, fallback = []) {
  if (!Array.isArray(values)) {
    return fallback;
  }

  const normalized = values.map((value) => normalizeText(value)).filter(Boolean);
  return normalized.length ? [...new Set(normalized)] : fallback;
}

function normalizeOptionalNumber(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeShortVideo(video, index = 0) {
  if (!video || typeof video !== "object") {
    return null;
  }

  const provider = normalizeText(video.provider, "direct").toLowerCase();
  const videoUrl = normalizeText(video.videoUrl);
  const embedUrl = normalizeText(video.embedUrl || video.embedLink);
  const sourceUrl = normalizeText(video.sourceUrl || video.shareUrl);
  const posterUrl = normalizeText(video.posterUrl || video.coverImageUrl || video.imageUrl);
  const normalizedProvider = provider === "tiktok" ? "tiktok" : "direct";

  if (normalizedProvider === "direct" && !videoUrl) {
    return null;
  }

  if (normalizedProvider === "tiktok" && !embedUrl && !sourceUrl) {
    return null;
  }

  return {
    id: normalizeText(video.id, `video-${index + 1}`),
    provider: normalizedProvider,
    title: normalizeText(video.title, normalizedProvider === "tiktok" ? "TikTok video" : "Product video"),
    posterUrl,
    videoUrl,
    embedUrl,
    sourceUrl,
    creatorHandle: normalizeText(video.creatorHandle),
    creatorName: normalizeText(video.creatorName),
    durationSeconds: normalizeOptionalNumber(video.durationSeconds),
    sourceLabel: normalizeText(video.sourceLabel, normalizedProvider === "tiktok" ? "TikTok" : "Video"),
  };
}

function normalizeShortVideoList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((video, index) => normalizeShortVideo(video, index))
    .filter(Boolean);
}

function extractPriceValue(priceLabel, fallback = 0) {
  const match = String(priceLabel || "").match(/\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : fallback;
}

function inferImageLayout(gift) {
  if (gift.imageLayout === "product" || gift.imageLayout === "editorial") {
    return gift.imageLayout;
  }

  return normalizeText(gift.imageUrl || gift.image) ? "product" : "editorial";
}

export function normalizeGift(gift, index = 0) {
  const accent = accentPairs[index % accentPairs.length];
  const imageLayout = inferImageLayout(gift);
  const imageUrl = normalizeText(gift.imageUrl || gift.image);
  const galleryImages = normalizeUrlList(gift.galleryImages).filter((value) => value !== imageUrl);
  const priceValue = normalizeNumber(gift.priceValue, extractPriceValue(gift.priceLabel, 0));
  const shortVideos = normalizeShortVideoList(gift.shortVideos);

  return {
    ...gift,
    id: normalizeText(gift.id, `gift-${index + 1}`),
    code: normalizeText(gift.code, `GS-${String(index + 1).padStart(2, "0")}`),
    name: normalizeText(gift.name, `Gift ${index + 1}`),
    priceValue,
    priceLabel: normalizeText(gift.priceLabel, priceValue ? `$${priceValue}` : "Price varies"),
    badge: normalizeText(gift.badge, "gift pick"),
    hook: normalizeText(gift.hook, "Strong fit with a clean buying path."),
    why: normalizeText(gift.why, "Useful, giftable, and easy to understand."),
    bestFor: normalizeText(gift.bestFor, "girlfriend / wife"),
    vibe: normalizeText(gift.vibe, "clean gift"),
    relationships: normalizeList(gift.relationships, ["anyone"]),
    intents: normalizeList(gift.intents, ["thoughtful"]),
    tabs: normalizeList(gift.tabs, ["best-overall"]),
    query: normalizeText(gift.query, normalizeText(gift.name, `gift ${index + 1}`).toLowerCase()),
    baseScore: normalizeNumber(gift.baseScore, 80),
    accentFrom: normalizeText(gift.accentFrom, accent.from),
    accentTo: normalizeText(gift.accentTo, accent.to),
    amazonAsin: normalizeText(gift.amazonAsin || gift.asin),
    imageUrl,
    image: imageUrl,
    galleryImages,
    shortVideos,
    imageLayout,
    imageFit:
      gift.imageFit === "contain" || gift.imageFit === "cover"
        ? gift.imageFit
        : imageLayout === "product"
          ? "contain"
          : "cover",
    imagePosition: normalizeText(gift.imagePosition, "center center"),
    imageBackground: normalizeText(
      gift.imageBackground,
      imageLayout === "product" ? "#f5f3ee" : "#ececec"
    ),
  };
}

export function normalizeCatalogGifts(gifts) {
  if (!Array.isArray(gifts)) {
    return [];
  }

  return gifts.map((gift, index) => normalizeGift(gift, index));
}

export function normalizeSeoCatalog(gifts) {
  if (!Array.isArray(gifts)) {
    return [];
  }

  return gifts.map((gift, index) => {
    const normalized = normalizeGift(gift, index);

    return {
      id: normalized.id,
      slug: normalizeText(gift.slug, normalized.id),
      name: normalized.name,
      brand: normalizeText(gift.brand),
      merchantName: normalizeText(gift.merchantName),
      priceLabel: normalized.priceLabel,
      priceValue: normalized.priceValue,
      badge: normalized.badge,
      hook: normalized.hook,
      why: normalized.why,
      bestFor: normalized.bestFor,
      query: normalized.query,
      amazonAsin: normalized.amazonAsin,
      affiliateUrl: normalizeText(gift.affiliateUrl),
      sourceProductUrl: normalizeText(gift.sourceProductUrl),
      imageUrl: normalized.imageUrl,
      galleryImages: normalized.galleryImages,
      shortVideos: normalized.shortVideos,
      imageLayout: normalized.imageLayout,
      imageFit: normalized.imageFit,
      imagePosition: normalized.imagePosition,
      imageBackground: normalized.imageBackground,
    };
  });
}
