import fs from "node:fs";
import path from "node:path";
import { seoSite } from "../src/content/seo-guides.js";

const publicDir = path.join(process.cwd(), "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");
const key = String(process.env.INDEXNOW_KEY || "").trim();
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const keyLocation = `${seoSite.url}/indexnow.txt`;
const siteOrigin = new URL(seoSite.url).origin;
const publicRoot = path.resolve(publicDir);

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim()).filter(Boolean);
}

function resolveLocalSitemapPath(loc) {
  const url = new URL(loc);

  if (url.origin !== siteOrigin) {
    throw new Error(`Sitemap index entry must stay on ${siteOrigin}: ${loc}`);
  }

  const relativePath = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

  if (!relativePath.endsWith(".xml")) {
    throw new Error(`Sitemap index entry must point to an XML sitemap file: ${loc}`);
  }

  const resolvedPath = path.resolve(publicRoot, relativePath);
  const relativeFromPublic = path.relative(publicRoot, resolvedPath);

  if (relativeFromPublic.startsWith("..") || path.isAbsolute(relativeFromPublic)) {
    throw new Error(`Sitemap index entry resolved outside public/: ${loc}`);
  }

  return resolvedPath;
}

function collectSitemapUrls(filePath, visited = new Set()) {
  const resolvedPath = path.resolve(filePath);

  if (visited.has(resolvedPath)) {
    return [];
  }

  visited.add(resolvedPath);

  const sitemapXml = fs.readFileSync(resolvedPath, "utf8");

  if (/<\s*sitemapindex\b/i.test(sitemapXml)) {
    return extractLocs(sitemapXml).flatMap((loc) => collectSitemapUrls(resolveLocalSitemapPath(loc), visited));
  }

  return extractLocs(sitemapXml);
}

if (!key) {
  console.error("INDEXNOW_KEY is required.");
  process.exit(1);
}

if (!fs.existsSync(sitemapPath)) {
  console.error(`Sitemap not found at ${sitemapPath}. Run the SEO page generator first.`);
  process.exit(1);
}

const urlList = [...new Set(collectSitemapUrls(sitemapPath))];

if (!urlList.length) {
  console.error("No URLs found in sitemap.xml.");
  process.exit(1);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    host: new URL(seoSite.url).hostname,
    key,
    keyLocation,
    urlList,
  }),
});

if (!response.ok) {
  console.error(`IndexNow submission failed with ${response.status}.`);
  console.error(await response.text());
  process.exit(1);
}

console.log(`IndexNow submission accepted for ${urlList.length} URLs.`);
