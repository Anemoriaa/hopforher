import fs from "node:fs";
import path from "node:path";
import { seoSite } from "../src/content/seo-guides.js";

const publicDir = path.join(process.cwd(), "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");
const key = String(process.env.INDEXNOW_KEY || "").trim();
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const keyLocation = `${seoSite.url}/indexnow.txt`;

if (!key) {
  console.error("INDEXNOW_KEY is required.");
  process.exit(1);
}

if (!fs.existsSync(sitemapPath)) {
  console.error(`Sitemap not found at ${sitemapPath}. Run the SEO page generator first.`);
  process.exit(1);
}

const sitemapXml = fs.readFileSync(sitemapPath, "utf8");
const urlList = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

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
