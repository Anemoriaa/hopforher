import { affiliateConfig, gifts, tabs } from "./index.js";

export const catalogOverrideKey = "giftsher-catalog-overrides-v1";
export const catalogUpdatedEvent = "giftsher:catalog-updated";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitCatalogUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(catalogUpdatedEvent));
}

export function readCatalogOverrides() {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(catalogOverrideKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function writeCatalogOverrides(nextOverrides) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(catalogOverrideKey, JSON.stringify(nextOverrides));
    emitCatalogUpdated();
  } catch (error) {
    return;
  }
}

export function clearCatalogOverrides() {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(catalogOverrideKey);
    emitCatalogUpdated();
  } catch (error) {
    return;
  }
}

export function getMergedGifts(overrides = readCatalogOverrides()) {
  return gifts.map((gift) => ({
    ...gift,
    ...(overrides[gift.id] || {}),
  }));
}

export function getCatalogSnapshot() {
  return {
    affiliateConfig,
    tabs,
    gifts: getMergedGifts(),
  };
}

export function saveGiftOverride(id, nextPatch) {
  const overrides = readCatalogOverrides();
  const nextOverrides = {
    ...overrides,
    [id]: {
      ...(overrides[id] || {}),
      ...nextPatch,
    },
  };

  writeCatalogOverrides(nextOverrides);
  return nextOverrides;
}

export function clearGiftOverride(id) {
  const overrides = readCatalogOverrides();

  if (!overrides[id]) {
    return overrides;
  }

  const nextOverrides = { ...overrides };
  delete nextOverrides[id];
  writeCatalogOverrides(nextOverrides);
  return nextOverrides;
}

export function hasGiftOverride(id, overrides = readCatalogOverrides()) {
  return Boolean(overrides[id]);
}

export function subscribeToCatalogUpdates(callback) {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorage = (event) => {
    if (!event.key || event.key === catalogOverrideKey) {
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(catalogUpdatedEvent, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(catalogUpdatedEvent, handleCustom);
  };
}
