import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function readFixture(relativePath) {
  return fs.readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("utility discovery files stay crawlable but out of search result slots", () => {
  const headers = readFixture("apps/web/public/_headers");

  assert.match(headers, /\/guide-catalog\.json\s+X-Robots-Tag: noindex/);
  assert.match(headers, /\/product-catalog\.json\s+X-Robots-Tag: noindex/);
  assert.match(headers, /\/page-catalog\.json\s+X-Robots-Tag: noindex/);
});

test("robots and sitemap index stay wired to segmented sitemap output", () => {
  const robots = readFixture("apps/web/public/robots.txt");
  const sitemapIndex = readFixture("apps/web/public/sitemap.xml");

  assert.match(robots, /Sitemap: https:\/\/shopforher\.org\/sitemap\.xml/);
  assert.match(robots, /Sitemap: https:\/\/shopforher\.org\/sitemap-products\.xml/);
  assert.match(sitemapIndex, /https:\/\/shopforher\.org\/sitemap-pages\.xml/);
  assert.match(sitemapIndex, /https:\/\/shopforher\.org\/sitemap-guides\.xml/);
  assert.match(sitemapIndex, /https:\/\/shopforher\.org\/sitemap-hot\.xml/);
  assert.match(sitemapIndex, /https:\/\/shopforher\.org\/sitemap-dates\.xml/);
  assert.match(sitemapIndex, /https:\/\/shopforher\.org\/sitemap-products\.xml/);
});

test("indexable guide and product pages emit canonical URLs", () => {
  const guideHtml = readFixture("apps/web/public/gifts-for-wife/index.html");
  const productHtml = readFixture("apps/web/public/gift/temperature-control-mug/index.html");

  assert.match(guideHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/gifts-for-wife\/">/);
  assert.match(productHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/gift\/temperature-control-mug\/">/);
  assert.match(productHtml, /<meta name="robots" content="index,follow/);
});

test("homepage shell reads like a crawlable front door instead of fallback-only copy", () => {
  const homeHtml = readFixture("apps/web/index.html");

  assert.doesNotMatch(homeHtml, /Fallback index/);
  assert.match(homeHtml, /href="\/guides\/"/);
  assert.match(homeHtml, /href="\/gift\/"/);
  assert.match(homeHtml, /href="\/site-map\.html"/);
});

test("reader cluster guides stay generated with their own canonicals and cross-links", () => {
  const booksGuideHtml = readFixture("apps/web/public/books-for-her/index.html");
  const kindleGuideHtml = readFixture("apps/web/public/kindle-gifts-for-her/index.html");
  const cozyGuideHtml = readFixture("apps/web/public/cozy-gifts-for-readers/index.html");
  const bookLoverGuideHtml = readFixture("apps/web/public/book-lover-gifts-for-her/index.html");
  const bookTokGuideHtml = readFixture("apps/web/public/booktok-gifts-for-her/index.html");
  const fourthWingProductHtml = readFixture("apps/web/public/gift/fourth-wing-kindle-edition/index.html");
  const empyreanProductHtml = readFixture("apps/web/public/gift/the-empyrean-series-3-book-set/index.html");

  assert.match(booksGuideHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/books-for-her\/">/);
  assert.match(kindleGuideHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/kindle-gifts-for-her\/">/);
  assert.match(cozyGuideHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/cozy-gifts-for-readers\/">/);
  assert.match(bookLoverGuideHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/book-lover-gifts-for-her\/">/);
  assert.match(bookTokGuideHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/booktok-gifts-for-her\/">/);
  assert.match(fourthWingProductHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/gift\/fourth-wing-kindle-edition\/">/);
  assert.match(empyreanProductHtml, /<link rel="canonical" href="https:\/\/shopforher\.org\/gift\/the-empyrean-series-3-book-set\/">/);
  assert.match(kindleGuideHtml, /Kindle gifts for her in 2026/);
  assert.match(cozyGuideHtml, /Cozy gifts for readers in 2026/);
  assert.match(bookLoverGuideHtml, /Book-lover gifts for her in 2026/);
  assert.match(bookTokGuideHtml, /BookTok gifts for her in 2026/);
  assert.match(booksGuideHtml, /Fourth Wing Kindle Edition/);
  assert.match(booksGuideHtml, /The Empyrean Series 3 Book Set/);
  assert.match(kindleGuideHtml, /Fourth Wing Kindle Edition/);
  assert.match(cozyGuideHtml, /The Wedding People Kindle Edition/);
  assert.match(bookLoverGuideHtml, /The Empyrean Series 3 Book Set/);
  assert.match(bookTokGuideHtml, /A Court of Thorns and Roses Kindle Edition/);
  assert.match(kindleGuideHtml, /href="\/books-for-her\/"/);
  assert.match(cozyGuideHtml, /href="\/kindle-gifts-for-her\/"/);
  assert.match(bookLoverGuideHtml, /href="\/booktok-gifts-for-her\/"/);
  assert.match(bookTokGuideHtml, /href="\/books-for-her\/"/);
  assert.doesNotMatch(booksGuideHtml, /Bose SoundLink Flex|Sunrise Alarm Clock/);
  assert.doesNotMatch(booksGuideHtml, /Kindle Paperwhite Signature Edition|Luxury Throw Blanket|Candle Warmer Lamp|Temperature-Control Mug|Koolaburra by UGG Burree Slipper/);
  assert.doesNotMatch(kindleGuideHtml, /Bose SoundLink Flex|Sunrise Alarm Clock|MagSafe Charging Stand|Noise-Canceling Earbuds|Kindle Paperwhite Signature Edition|Luxury Throw Blanket|Candle Warmer Lamp|Temperature-Control Mug|Koolaburra by UGG Burree Slipper/);
  assert.doesNotMatch(cozyGuideHtml, /Nespresso Vertuo Next|Sunrise Alarm Clock|Mulberry Silk Pillowcase Set|Kindle Paperwhite Signature Edition|Luxury Throw Blanket|Candle Warmer Lamp|Temperature-Control Mug|Koolaburra by UGG Burree Slipper/);
  assert.doesNotMatch(bookLoverGuideHtml, /Bose SoundLink Flex|Sunrise Alarm Clock|Nespresso Vertuo Next|Kindle Paperwhite Signature Edition|Luxury Throw Blanket|Candle Warmer Lamp|Temperature-Control Mug|Koolaburra by UGG Burree Slipper/);
  assert.doesNotMatch(bookTokGuideHtml, /Bose SoundLink Flex|Sunrise Alarm Clock|Nespresso Vertuo Next|MagSafe Charging Stand|Noise-Canceling Earbuds|Kindle Paperwhite Signature Edition|Luxury Throw Blanket|Candle Warmer Lamp|Temperature-Control Mug|Koolaburra by UGG Burree Slipper/);
});

test("blocked product pages remain noindex and search-facing guides stop linking to their internal URLs", () => {
  const blockedProductHtml = readFixture("apps/web/public/gift/mchic-colorful-beaded-choker/index.html");
  const guideHtml = readFixture("apps/web/public/best-gifts-under-75/index.html");

  assert.match(blockedProductHtml, /<meta name="robots" content="noindex,follow/);
  assert.doesNotMatch(guideHtml, /href="\/gift\/mchic-colorful-beaded-choker\/"/);
  assert.doesNotMatch(guideHtml, /https:\/\/shopforher\.org\/gift\/mchic-colorful-beaded-choker\//);
  assert.match(guideHtml, /href="https:\/\/www\.amazon\.com\/s\?/);
});
