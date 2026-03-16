import assert from "node:assert/strict";
import test from "node:test";
import { seoGuides } from "../../apps/web/src/content/seo-guides.js";

const guideBySlug = new Map(seoGuides.map((guide) => [guide.slug, guide]));
const coreBookIds = new Set([
  "fourth-wing-kindle",
  "the-women-kindle",
  "the-wedding-people-kindle",
  "acotar-kindle",
  "empyrean-box-set",
]);

test("book guides keep distinct product lanes", () => {
  const booksGuide = guideBySlug.get("books-for-her");
  const kindleGuide = guideBySlug.get("kindle-gifts-for-her");
  const cozyGuide = guideBySlug.get("cozy-gifts-for-readers");
  const bookLoverGuide = guideBySlug.get("book-lover-gifts-for-her");
  const booktokGuide = guideBySlug.get("booktok-gifts-for-her");

  assert.ok(booksGuide);
  assert.ok(kindleGuide);
  assert.ok(cozyGuide);
  assert.ok(bookLoverGuide);
  assert.ok(booktokGuide);

  assert.ok(booksGuide.itemIds.every((giftId) => coreBookIds.has(giftId)));
  assert.ok(kindleGuide.itemIds.includes("kindle-paperwhite"));
  assert.ok(kindleGuide.itemIds.includes("strapsicle-straps"));
  assert.ok(cozyGuide.itemIds.includes("glocusent-book-light"));
  assert.ok(cozyGuide.itemIds.includes("glocusent-neck-light"));
  assert.ok(bookLoverGuide.itemIds.includes("strapsicle-clutch"));
  assert.ok(bookLoverGuide.itemIds.includes("kindle-paperwhite"));
  assert.ok(booktokGuide.itemIds.includes("fourth-wing-kindle"));
  assert.ok(booktokGuide.itemIds.includes("acotar-kindle"));

  const signatures = new Set(
    [booksGuide, kindleGuide, cozyGuide, bookLoverGuide, booktokGuide].map((guide) => guide.itemIds.join(","))
  );

  assert.equal(signatures.size, 5);
});
