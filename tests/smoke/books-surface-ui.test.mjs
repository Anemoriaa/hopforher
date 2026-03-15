import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getProductMedia } from "../../packages/catalog/media.js";
import { booksSurfaceGiftIds } from "../../apps/web/src/content/home-surfaces.js";

const appSource = fs.readFileSync(new URL("../../apps/web/src/App.jsx", import.meta.url), "utf8");

test("books surface keeps guide routing inside the books lane", () => {
  assert.match(
    appSource,
    /const surfaceGuideByRelationship = homeSurface\.id === "books" \? bookGuideByRelationship : guideByRelationship;/
  );
  assert.match(appSource, /const allGuidesHref = homeSurface\.id === "books" \? "\/booksforher\/" : "\/guides\/";/);
  assert.match(appSource, /const shouldShowDateCityPanel = homeSurface\.id !== "books";/);
  assert.match(appSource, /return homeSurface\.id === "books" \? "Read" : t\("nav\.dates"\);/);
  assert.match(
    appSource,
    /if \(homeSurface\.id !== "books" && activeSlide === datesSlideIndex && geoState\.status === "idle"\)/
  );
});

test("books surface gifts use local book artwork", () => {
  const imageUrls = booksSurfaceGiftIds.map((giftId) => getProductMedia(giftId).imageUrl);

  assert.equal(imageUrls.length, booksSurfaceGiftIds.length);
  assert.ok(imageUrls.every((imageUrl) => typeof imageUrl === "string" && imageUrl.startsWith("/brand-art/books/")));
});

test("shared image helpers prioritize merged local artwork and avoid TikTok poster dependencies", () => {
  assert.match(
    appSource,
    /const productMedia = getProductMedia\(gift\.id\);\s+const resolvedCandidates = \[\s+productMedia\.imageUrl,\s+gift\.imageUrl,\s+gift\.image,\s+\.\.\.\(productMedia\.galleryImages \|\| \[\]\),\s+\.\.\.\(gift\.galleryImages \|\| \[\]\),\s+\]\.filter\(Boolean\);/s
  );
  assert.match(
    appSource,
    /const localFirstCandidates = dedupedCandidates\.filter\(\(value\) => isLocalImageUrl\(value\)\);\s+\s*return localFirstCandidates\.length\s+\? \[\.\.\.localFirstCandidates, \.\.\.dedupedCandidates\.filter\(\(value\) => !isLocalImageUrl\(value\)\)\]\s+: dedupedCandidates;/s
  );
  assert.match(
    appSource,
    /const displayPosterUrl =\s+video\.provider === "tiktok"\s+\? fallbackPosterUrl\s+: video\.posterUrl \|\| fallbackPosterUrl;/s
  );
  assert.match(appSource, /const posterUrl = media\?\.posterUrl \|\| media\?\.nativePosterUrl \|\| getGiftImageUrl\(gift\);/);
});
