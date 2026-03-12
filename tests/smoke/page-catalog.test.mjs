import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { seoCatalog, seoDateCities, seoGuides, seoHotStories } from "../../apps/web/src/content/seo-guides.js";

const pageCatalog = JSON.parse(
  fs.readFileSync(new URL("../../apps/web/public/page-catalog.json", import.meta.url), "utf8")
);

test("page catalog stays aligned with the current SEO inventory", () => {
  const counts = pageCatalog.pages.reduce((map, page) => {
    map.set(page.pageType, (map.get(page.pageType) || 0) + 1);
    return map;
  }, new Map());

  assert.equal(counts.get("guide"), seoGuides.length);
  assert.equal(counts.get("hot-story"), seoHotStories.length);
  assert.equal(counts.get("date-city"), seoDateCities.length);
  assert.equal(counts.get("product"), seoCatalog.length);
  assert.equal(counts.get("index"), 6);
  assert.equal(counts.get("trust"), 3);
  assert.equal(pageCatalog.summary.totalPages, pageCatalog.pages.length);
  assert.equal(pageCatalog.summary.byPageType.guide, seoGuides.length);
});

test("page catalog exposes guide and product taxonomy fields", () => {
  const girlfriendGuide = pageCatalog.pages.find((page) => page.id === "guide:gifts-for-girlfriend");
  const silkProduct = pageCatalog.pages.find((page) => page.id === "product:mulberry-silk-pillowcase-set");
  const bunnyProduct = pageCatalog.pages.find((page) => page.id === "product:large-easter-bunny-porch-decor");
  const merchantGap = pageCatalog.ops.productsMissingDirectMerchantPath.find((product) => product.slug === "oliker-speckled-eggs");

  assert.ok(girlfriendGuide, "expected girlfriend guide entry");
  assert.ok(silkProduct, "expected silk pillowcase product entry");
  assert.ok(bunnyProduct, "expected bunny porch product entry");
  assert.ok(merchantGap, "expected merchant gap entry");
  assert.ok(girlfriendGuide.taxonomy.primary.relationships.includes("girlfriend"));
  assert.ok(girlfriendGuide.taxonomy.coverage.relationshipTags.includes("girlfriend"));
  assert.ok(silkProduct.taxonomy.primary.intentTags.includes("thoughtful"));
  assert.ok(silkProduct.taxonomy.primary.tabTags.includes("looks-expensive"));
  assert.ok(silkProduct.taxonomy.primary.priceBands.includes("under-100"));
  assert.equal(bunnyProduct.searchIndexable, true);
  assert.equal(bunnyProduct.commerce.merchantName, "Walmart");
  assert.equal(silkProduct.entities.catalogGiftId, "silk-pillowcase");
  assert.equal(merchantGap.id, "oliker-speckled-eggs");
  assert.match(merchantGap.query, /OLIKER 24 Pcs Easter Speckled Eggs/);
  assert.ok(Array.isArray(pageCatalog.ops.productsMissingDirectMerchantPath));
});
