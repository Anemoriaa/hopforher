import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pageCatalogPath = path.join(scriptDir, "..", "public", "page-catalog.json");

if (!fs.existsSync(pageCatalogPath)) {
  console.error("Missing apps/web/public/page-catalog.json. Run `npm run build` first.");
  process.exit(1);
}

const pageCatalog = JSON.parse(fs.readFileSync(pageCatalogPath, "utf8"));
const { generatedAt, summary = {}, ops = {} } = pageCatalog;

function renderEntries(entries = [], formatter) {
  if (!Array.isArray(entries) || !entries.length) {
    return ["- none"];
  }

  return entries.map(formatter);
}

function renderCountMap(record = {}) {
  return Object.entries(record)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `- ${key}: ${value}`);
}

const nextActions = [];

if (Array.isArray(ops.guidesNeedingEditorialRefresh) && ops.guidesNeedingEditorialRefresh.length) {
  nextActions.push(
    `- Reduce overlap in: ${ops.guidesNeedingEditorialRefresh.map((guide) => guide.slug).join(", ")}`
  );
}

if (Array.isArray(ops.searchSuppressedGuides) && ops.searchSuppressedGuides.length) {
  nextActions.push(
    `- Recheck suppressed guides after each overlap pass: ${ops.searchSuppressedGuides.map((guide) => guide.slug).join(", ")}`
  );
}

if (Array.isArray(ops.productsMissingDirectMerchantPath) && ops.productsMissingDirectMerchantPath.length) {
  nextActions.push(
    `- Add direct merchant paths for: ${ops.productsMissingDirectMerchantPath.map((product) => product.slug).join(", ")}`
  );
}

const lines = [
  "# ShopForHer SEO Ops Report",
  "",
  `Generated: ${generatedAt || "unknown"}`,
  "",
  "## Summary",
  `- Total pages: ${summary.totalPages ?? 0}`,
  `- Search-indexable pages: ${summary.searchIndexablePages ?? 0}`,
  `- Blocked pages: ${summary.blockedPages ?? 0}`,
  "",
  "## Page Types",
  ...renderCountMap(summary.byPageType || {}),
  "",
  "## Archetypes",
  ...renderCountMap(summary.byArchetype || {}),
  "",
  "## Guide Refresh Queue",
  ...renderEntries(
    ops.guidesNeedingEditorialRefresh,
    (guide) => `- ${guide.slug} (${guide.pageUrl})`
  ),
  "",
  "## Search-Suppressed Guides",
  ...renderEntries(
    ops.searchSuppressedGuides,
    (guide) => `- ${guide.slug} [${guide.reason}] (${guide.pageUrl})`
  ),
  "",
  "## Merchant-Path Gaps",
  ...renderEntries(
    ops.productsMissingDirectMerchantPath,
    (product) =>
      `- ${product.slug} [${product.reason}] · catalog:${product.id}${product.query ? ` · query: ${product.query}` : ""} (${product.pageUrl})`
  ),
  "",
  "## Suggested Next Actions",
  ...(nextActions.length ? nextActions : ["- none"]),
];

console.log(lines.join("\n"));
