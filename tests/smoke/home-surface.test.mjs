import assert from "node:assert/strict";
import test from "node:test";
import { resolveHomeSurface } from "../../apps/web/src/content/home-surfaces.js";

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
});
