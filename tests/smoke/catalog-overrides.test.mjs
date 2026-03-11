import assert from "node:assert/strict";
import test from "node:test";
import { readCatalogOverrides, sanitizeCatalogOverrides } from "../../packages/catalog/storage.js";

test("sanitizeCatalogOverrides drops malformed top-level entries and object-valued fields", () => {
  const sanitized = sanitizeCatalogOverrides({
    valid: {
      name: "Updated gift",
      priceValue: 99,
      enabled: true,
      galleryImages: ["https://example.com/1.jpg"],
      shortVideos: [
        {
          id: "video-1",
          provider: "tiktok",
          sourceUrl: "https://www.tiktok.com/@demo/video/123",
        },
      ],
      nestedObjectField: { bad: true },
    },
    invalidPatch: "not-an-object",
  });

  assert.deepEqual(sanitized, {
    valid: {
      name: "Updated gift",
      priceValue: 99,
      enabled: true,
      galleryImages: ["https://example.com/1.jpg"],
      shortVideos: [
        {
          id: "video-1",
          provider: "tiktok",
          sourceUrl: "https://www.tiktok.com/@demo/video/123",
        },
      ],
    },
  });
});

test("readCatalogOverrides sanitizes malformed localStorage payloads", (t) => {
  const originalWindow = global.window;
  const listeners = new Map();

  global.window = {
    localStorage: {
      getItem(key) {
        assert.equal(key, "giftsher-catalog-overrides-v1");
        return JSON.stringify({
          giftA: {
            name: "Stored override",
            shortVideos: [{ id: "video-2", provider: "tiktok", sourceUrl: "https://www.tiktok.com/@demo/video/456" }],
            nestedObjectField: { drop: true },
          },
          broken: 42,
        });
      },
    },
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    dispatchEvent() {},
  };

  t.after(() => {
    if (originalWindow === undefined) {
      delete global.window;
      return;
    }

    global.window = originalWindow;
  });

  assert.deepEqual(readCatalogOverrides(), {
    giftA: {
      name: "Stored override",
      shortVideos: [{ id: "video-2", provider: "tiktok", sourceUrl: "https://www.tiktok.com/@demo/video/456" }],
    },
  });
});
