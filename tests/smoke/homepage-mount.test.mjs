import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appSource = fs.readFileSync(new URL("../../apps/web/src/App.jsx", import.meta.url), "utf8");
const indexHtml = fs.readFileSync(new URL("../../apps/web/index.html", import.meta.url), "utf8");

test("homepage surface metadata is declared before the document meta effect reads it", () => {
  const metaDeclarationIndex = appSource.indexOf(
    'const homeSurfaceMeta = useMemo(() => getHomeSurfaceMeta(homeSurface.id), [homeSurface.id]);'
  );
  const metaEffectIndex = appSource.indexOf("document.title = homeSurfaceMeta.title;");

  assert.notEqual(metaDeclarationIndex, -1, "expected home surface meta declaration");
  assert.notEqual(metaEffectIndex, -1, "expected home surface meta effect");
  assert.ok(
    metaDeclarationIndex < metaEffectIndex,
    "home surface metadata must be initialized before the effect dependency array reads it"
  );
});

test("homepage shell hides when the interactive app marks itself mounted", () => {
  assert.match(appSource, /document\.body\.dataset\.appMounted = "true";/);
  assert.match(indexHtml, /body\[data-app-mounted="true"\] #seo-home-shell/);
});
