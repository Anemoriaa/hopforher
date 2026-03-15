import assert from "node:assert/strict";
import test from "node:test";
import {
  booksSurfaceGiftIds,
  booksSurfaceGuideSlugs,
  resolveHomeSurface,
} from "../../apps/web/src/content/home-surfaces.js";

const passthroughT = (key) => key;

test("books surface keeps its own home href and drops preview brand copy", () => {
  const defaultSurface = resolveHomeSurface({
    pathname: "/",
    t: passthroughT,
    updatedLabel: "March 14, 2026",
  });
  const booksSurface = resolveHomeSurface({
    pathname: "/booksforher/",
    t: passthroughT,
    updatedLabel: "March 14, 2026",
  });

  assert.equal(defaultSurface.brandHref, "/");
  assert.equal(booksSurface.brandHref, "/booksforher/");
  assert.equal(booksSurface.brandContext, null);
  assert.doesNotMatch(booksSurface.hero.summary, /preview/i);
  assert.deepEqual(booksSurfaceGiftIds, [
    "fourth-wing-kindle",
    "the-women-kindle",
    "the-wedding-people-kindle",
    "acotar-kindle",
    "empyrean-box-set",
  ]);
  assert.deepEqual(booksSurface.topPickIds, booksSurfaceGiftIds);
  assert.deepEqual(booksSurface.featuredProductIds, booksSurfaceGiftIds);
  assert.deepEqual(booksSurface.libraryProductIds, booksSurfaceGiftIds);
  assert.deepEqual(booksSurface.hotGiftIds, booksSurfaceGiftIds);
  assert.deepEqual(booksSurface.guideSlugs, booksSurfaceGuideSlugs);
  assert.deepEqual(booksSurface.hotGuideSlugs, booksSurfaceGuideSlugs);
  assert.doesNotMatch(
    booksSurface.topPickIds.join(","),
    /kindle-paperwhite|luxury-throw|candle-warmer|temperature-mug|ugg-slippers|bose-speaker|sunrise-alarm|nespresso-machine|earbuds|magsafe-stand/
  );
});
