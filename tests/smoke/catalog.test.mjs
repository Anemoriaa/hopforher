import assert from "node:assert/strict";
import test from "node:test";
import { seoCatalog } from "../../apps/web/src/content/seo-guides.js";
import { buildAffiliateLink } from "../../apps/web/src/lib/catalog.js";
import { importedCatalogItems } from "../../packages/catalog/imported-items.js";
import { gifts } from "../../packages/catalog/index.js";

test("catalog package imports cleanly in Node", () => {
  assert.ok(Array.isArray(gifts));
  assert.ok(gifts.length > 0);
});

test("Amazon source product URLs keep the associate tag", () => {
  const gift = importedCatalogItems.find((item) => item.id === "sheer-crochet-poncho-top");
  assert.ok(gift, "expected imported Amazon gift fixture");

  const url = new URL(buildAffiliateLink(gift));
  assert.equal(url.hostname, "www.amazon.com");
  assert.equal(url.searchParams.get("tag"), "shopforher0b7-20");
});

test("direct merchant URLs stay unchanged", () => {
  const gift = seoCatalog.find((item) => item.id === "sol-de-janeiro");
  assert.ok(gift, "expected direct merchant fixture");

  const url = new URL(buildAffiliateLink(gift));
  assert.equal(url.hostname, "soldejaneiro.com");
  assert.equal(url.searchParams.get("tag"), null);
});
