import assert from "node:assert/strict";
import test from "node:test";
import {
  booksSurfaceGiftIds,
  booksSurfaceGuideSlugs,
  filterCatalogGiftsForSurface,
  getHomeSurfaceMeta,
  resolveHomeSurface,
} from "../../apps/web/src/content/home-surfaces.js";
import { translateUi } from "../../apps/web/src/lib/i18n.js";
import { gifts } from "../../packages/catalog/index.js";

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

test("default surface gift pool excludes books while books surface stays book-only", () => {
  const defaultGiftIds = filterCatalogGiftsForSurface(gifts, "default").map((gift) => gift.id);
  const booksGiftIds = filterCatalogGiftsForSurface(gifts, "books").map((gift) => gift.id);

  assert.ok(defaultGiftIds.length > 0);
  assert.ok(defaultGiftIds.every((giftId) => !booksSurfaceGiftIds.includes(giftId)));
  assert.deepEqual(booksGiftIds, booksSurfaceGiftIds);
});

test("books surface resolves localized copy and metadata for locale-aware shells", () => {
  const tEs = (key, variables) => translateUi(key, ["es-ES"], variables);
  const booksSurface = resolveHomeSurface({
    pathname: "/booksforher/",
    t: tEs,
    updatedLabel: "16 de marzo de 2026",
  });
  const booksMeta = getHomeSurfaceMeta("books", tEs);

  assert.equal(booksSurface.brandHomeAria, "Inicio de BooksForHer");
  assert.equal(booksSurface.hero.overline, "Vía de libros");
  assert.equal(booksSurface.decisionModule.overline, "Selector de libros");
  assert.equal(booksSurface.hotFeed.storiesTitle, "Leer las páginas de libros");
  assert.equal(booksMeta.title, "BooksForHer | Regalos de libros para ella, comprados rápido");
  assert.equal(
    booksMeta.description,
    "BooksForHer ayuda a los hombres a comprar rápido libros reales, ediciones Kindle y selecciones en caja para ella."
  );
});
