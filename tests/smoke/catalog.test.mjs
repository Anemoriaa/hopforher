import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { seoCatalog } from "../../apps/web/src/content/seo-guides.js";
import { buildAffiliateLink } from "../../apps/web/src/lib/catalog.js";
import { resolveGiftMerchantName } from "../../apps/web/src/lib/affiliate.js";
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

test("merchant names are inferred from direct merchant hosts when missing", () => {
  const gift = importedCatalogItems.find((item) => item.id === "saodimallsu-crochet-coverup-set");
  assert.ok(gift, "expected Giftpals direct merchant fixture");

  assert.equal(resolveGiftMerchantName(gift), "Giftpals");
});

test("newly verified imported items keep direct merchant routing", () => {
  const olikerGift = importedCatalogItems.find((item) => item.id === "oliker-speckled-eggs");
  const roseSeekGift = importedCatalogItems.find((item) => item.id === "roseseek-crochet-lace-pants");
  assert.ok(olikerGift, "expected OLIKER direct merchant fixture");
  assert.ok(roseSeekGift, "expected RoseSeek direct merchant fixture");

  const olikerUrl = new URL(buildAffiliateLink(olikerGift));
  assert.equal(olikerUrl.hostname, "www.amazon.com");
  assert.equal(olikerUrl.pathname, "/dp/B0DSBGK88Q");
  assert.equal(olikerUrl.searchParams.get("tag"), "shopforher0b7-20");

  assert.equal(resolveGiftMerchantName(roseSeekGift), "Giftpals");
  assert.equal(buildAffiliateLink(roseSeekGift), "https://giftpals.com/item/roseseek-women-s-cover-up-beach-pants-hollow-out-2");
});

test("generated direct merchant pages keep the inferred merchant label", () => {
  const html = fs.readFileSync(
    new URL("../../apps/web/public/gift/saodimallsu-crochet-cover-up-set/index.html", import.meta.url),
    "utf8"
  );

  assert.match(html, /<strong>Giftpals<\/strong>/);
  assert.match(html, /data-affiliate-merchant="Giftpals"/);
});
