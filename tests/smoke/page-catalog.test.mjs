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
  assert.equal(counts.get("index"), 7);
  assert.equal(counts.get("trust"), 3);
  assert.equal(pageCatalog.summary.totalPages, pageCatalog.pages.length);
  assert.equal(pageCatalog.summary.byPageType.guide, seoGuides.length);
  assert.equal(pageCatalog.summary.byPageType.index, 7);
});

test("page catalog exposes guide and product taxonomy fields", () => {
  const girlfriendGuide = pageCatalog.pages.find((page) => page.id === "guide:gifts-for-girlfriend");
  const silkProduct = pageCatalog.pages.find((page) => page.id === "product:mulberry-silk-pillowcase-set");
  const bunnyProduct = pageCatalog.pages.find((page) => page.id === "product:large-easter-bunny-porch-decor");
  const olikerProduct = pageCatalog.pages.find((page) => page.id === "product:oliker-speckled-eggs");
  const merchantGap = pageCatalog.ops.productsMissingDirectMerchantPath.find((product) => product.slug === "mchic-colorful-beaded-choker");

  assert.ok(girlfriendGuide, "expected girlfriend guide entry");
  assert.ok(silkProduct, "expected silk pillowcase product entry");
  assert.ok(bunnyProduct, "expected bunny porch product entry");
  assert.ok(olikerProduct, "expected OLIKER product entry");
  assert.ok(merchantGap, "expected merchant gap entry");
  assert.ok(girlfriendGuide.taxonomy.primary.relationships.includes("girlfriend"));
  assert.ok(girlfriendGuide.taxonomy.coverage.relationshipTags.includes("girlfriend"));
  assert.ok(silkProduct.taxonomy.primary.intentTags.includes("thoughtful"));
  assert.ok(silkProduct.taxonomy.primary.tabTags.includes("looks-expensive"));
  assert.ok(silkProduct.taxonomy.primary.priceBands.includes("under-100"));
  assert.equal(bunnyProduct.searchIndexable, true);
  assert.equal(olikerProduct.searchIndexable, true);
  assert.equal(bunnyProduct.commerce.merchantName, "Walmart");
  assert.equal(silkProduct.entities.catalogGiftId, "silk-pillowcase");
  assert.equal(merchantGap.id, "mchic-beaded-choker");
  assert.match(merchantGap.query, /Mchic Colorful Beaded Choker Necklace/);
  assert.ok(merchantGap.imageHosts.includes("i.etsystatic.com"));
  assert.equal(
    pageCatalog.ops.productsMissingDirectMerchantPath.some((product) => product.slug === "oliker-speckled-eggs"),
    false
  );
  assert.ok(Array.isArray(pageCatalog.ops.productsMissingDirectMerchantPath));
});

test("date city pages expose geo coverage and related crawl paths", () => {
  const losAngelesPage = pageCatalog.pages.find((page) => page.id === "date-city:los-angeles");

  assert.ok(losAngelesPage, "expected Los Angeles date-city entry");
  assert.equal(losAngelesPage.entities.regionCode, "CA");
  assert.equal(losAngelesPage.entities.neighborhoodCount, 4);
  assert.ok(losAngelesPage.entities.neighborhoods.includes("West Hollywood"));
  assert.ok(losAngelesPage.entities.spotTypes.includes("Dinner"));
  assert.ok(losAngelesPage.entities.relatedGuideSlugs.includes("date-night-gifts-for-her"));
  assert.ok(losAngelesPage.entities.relatedGuideSlugs.includes("anniversary-gifts-for-her"));
  assert.ok(losAngelesPage.entities.relatedCitySlugs.includes("new-york"));
  assert.equal(losAngelesPage.entities.latitude, 34.0522);
  assert.equal(losAngelesPage.entities.longitude, -118.2437);
});
