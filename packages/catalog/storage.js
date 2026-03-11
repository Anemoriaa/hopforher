import { affiliateConfig, gifts, tabs } from "./index.js";

export const catalogOverrideKey = "giftsher-catalog-overrides-v1";
export const catalogUpdatedEvent = "giftsher:catalog-updated";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeOverrideArrayValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeOverrideArrayValue(entry))
      .filter((entry) => entry !== undefined);
  }

  if (!isPlainObject(value)) {
    return undefined;
  }

  const nextObject = {};

  Object.entries(value).forEach(([key, entry]) => {
    const sanitizedEntry = sanitizeOverrideArrayValue(entry);

    if (sanitizedEntry !== undefined) {
      nextObject[key] = sanitizedEntry;
    }
  });

  return nextObject;
}

function sanitizeOverrideFieldValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeOverrideArrayValue(entry))
      .filter((entry) => entry !== undefined);
  }

  return undefined;
}

function sanitizeOverridePatch(patch) {
  if (!isPlainObject(patch)) {
    return {};
  }

  return Object.entries(patch).reduce((nextPatch, [key, value]) => {
    const sanitizedValue = sanitizeOverrideFieldValue(value);

    if (sanitizedValue !== undefined) {
      nextPatch[key] = sanitizedValue;
    }

    return nextPatch;
  }, {});
}

export function sanitizeCatalogOverrides(rawOverrides) {
  if (!isPlainObject(rawOverrides)) {
    return {};
  }

  return Object.entries(rawOverrides).reduce((nextOverrides, [id, patch]) => {
    if (!id.trim()) {
      return nextOverrides;
    }

    const sanitizedPatch = sanitizeOverridePatch(patch);

    if (Object.keys(sanitizedPatch).length) {
      nextOverrides[id] = sanitizedPatch;
    }

    return nextOverrides;
  }, {});
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
    return sanitizeCatalogOverrides(parsed);
  } catch (error) {
    return {};
  }
}

export function writeCatalogOverrides(nextOverrides) {
  const sanitizedOverrides = sanitizeCatalogOverrides(nextOverrides);

  if (!isBrowser()) return sanitizedOverrides;

  try {
    window.localStorage.setItem(catalogOverrideKey, JSON.stringify(sanitizedOverrides));
    emitCatalogUpdated();
  } catch (error) {
    return sanitizedOverrides;
  }

  return sanitizedOverrides;
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
  const sanitizedOverrides = sanitizeCatalogOverrides(overrides);

  return gifts.map((gift) => ({
    ...gift,
    ...(sanitizedOverrides[gift.id] || {}),
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
  const nextOverrides = sanitizeCatalogOverrides({
    ...overrides,
    [id]: {
      ...(overrides[id] || {}),
      ...(isPlainObject(nextPatch) ? nextPatch : {}),
    },
  });

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
  return Boolean(sanitizeCatalogOverrides(overrides)[id]);
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
