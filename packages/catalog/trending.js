import curatedTrendingCollections from "./trending-collections.json" with { type: "json" };

function cloneTrendingCollection(collection) {
  if (!collection) {
    return null;
  }

  return {
    ...collection,
    ids: Array.isArray(collection.ids) ? [...collection.ids] : [],
  };
}

function buildTrendingCollections() {
  const collections = Object.fromEntries(
    Object.entries(curatedTrendingCollections).map(([surfaceId, collection]) => [surfaceId, cloneTrendingCollection(collection)])
  );

  if (!collections.default) {
    throw new Error('Missing required trending collection: "default"');
  }

  return collections;
}

export const trendingCollections = buildTrendingCollections();

export const defaultTrendingCollection = trendingCollections.default;

export function getTrendingCollection(surfaceId = "default") {
  return trendingCollections[surfaceId] || trendingCollections.default;
}

export function getTrendingGiftIds(surfaceId = "default") {
  return [...(getTrendingCollection(surfaceId)?.ids || [])];
}

export function getTrendingGiftIdSet(surfaceId = "default") {
  return new Set(getTrendingGiftIds(surfaceId));
}

export function selectTrendingGifts(catalogGifts, surfaceId = "default") {
  if (!Array.isArray(catalogGifts)) {
    return [];
  }

  const ids = getTrendingGiftIds(surfaceId);
  const liveGiftById = new Map(catalogGifts.map((gift) => [gift?.id, gift]));

  return ids.map((id) => liveGiftById.get(id)).filter(Boolean);
}
