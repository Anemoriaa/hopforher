import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appSource = fs.readFileSync(new URL("../../apps/web/src/App.jsx", import.meta.url), "utf8");

test("slide navigation does not reference removed menu-toggle state", () => {
  assert.doesNotMatch(appSource, /setIsNavMenuOpen\(/);
  assert.match(appSource, /function setSlide\(index\)/);
  assert.match(appSource, /setActiveSlide\(nextIndex\)/);
  assert.match(appSource, /onTouchStartCapture=\{onTouchStart\}/);
  assert.match(appSource, /onTouchMoveCapture=\{onTouchMove\}/);
  assert.match(appSource, /onTouchEndCapture=\{onTouchEnd\}/);
  assert.match(appSource, /event\.preventDefault\(\)/);
});
