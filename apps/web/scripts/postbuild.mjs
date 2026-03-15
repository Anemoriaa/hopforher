import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getHomeSurfaceMeta } from "../src/content/home-surfaces.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(scriptDir, "..");
const distDir = path.join(webRoot, "dist");
const distIndexPath = path.join(distDir, "index.html");
const autosubmitSetting = String(process.env.INDEXNOW_AUTOSUBMIT || "").trim().toLowerCase();
const strictSetting = String(process.env.INDEXNOW_STRICT || "").trim().toLowerCase();
const autosubmitDisabled = ["0", "false", "no", "off"].includes(autosubmitSetting);
const strictMode = ["1", "true", "yes", "on"].includes(strictSetting);
const indexNowKey = String(process.env.INDEXNOW_KEY || "").trim();

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeVerificationFilename(value) {
  const filename = String(value || "").trim();

  if (!filename) {
    return "";
  }

  if (path.basename(filename) !== filename || !filename.endsWith(".html")) {
    throw new Error("GOOGLE_SITE_VERIFICATION_FILE must be a plain .html filename, for example google1234567890abcdef.html");
  }

  return filename;
}

function applyHomeSurfaceMeta(html, surfaceId) {
  const meta = getHomeSurfaceMeta(surfaceId);

  return html
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtmlAttribute(meta.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeHtmlAttribute(meta.canonicalUrl)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtmlAttribute(meta.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtmlAttribute(meta.socialDescription)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escapeHtmlAttribute(meta.canonicalUrl)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtmlAttribute(meta.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtmlAttribute(meta.socialDescription)}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttribute(meta.title)}</title>`);
}

function applyBooksSurfaceShellCopy(html) {
  const booksGuideSection = `      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Start here</p>
          <h2>Book gift guides</h2>
        </div>
        <div class="discovery-link-list">
          <a class="discovery-link-card" href="/books-for-her/">
            <span>Books</span>
            <strong>Book gifts for her in 2026</strong>
            <p>A book-first shortlist built around actual Kindle editions, broader fiction picks, and one stronger boxed-set move.</p>
          </a>
          <a class="discovery-link-card" href="/kindle-gifts-for-her/">
            <span>Kindle</span>
            <strong>Kindle gifts for her in 2026</strong>
            <p>The ebook-first lane when exact Kindle editions matter more than devices, accessories, or reading-setup gear.</p>
          </a>
          <a class="discovery-link-card" href="/cozy-gifts-for-readers/">
            <span>Cozy</span>
            <strong>Cozy gifts for readers in 2026</strong>
            <p>Softer fiction and comfort-read picks when the gift should still be an actual book instead of cozy filler.</p>
          </a>
          <a class="discovery-link-card" href="/book-lover-gifts-for-her/">
            <span>Identity</span>
            <strong>Book-lover gifts for her in 2026</strong>
            <p>Broader bookish picks when you want actual books and one visible stack-worthy set instead of reader merch.</p>
          </a>
          <a class="discovery-link-card" href="/booktok-gifts-for-her/">
            <span>BookTok</span>
            <strong>BookTok gifts for her in 2026</strong>
            <p>Current BookTok books and Kindle editions when you want the online-reading angle without generic trend clutter.</p>
          </a>
          <a class="discovery-link-card" href="/gift/fourth-wing-kindle-edition/">
            <span>Product</span>
            <strong>Fourth Wing Kindle Edition product page</strong>
            <p>The fastest route when one current Kindle title already feels right.</p>
          </a>
        </div>
      </section>`;
  const defaultGuideSection = `      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Start here</p>
          <h2>Core gift guides</h2>
        </div>
        <div class="discovery-link-list">
          <a class="discovery-link-card" href="/gifts-for-girlfriend/">
            <span>Relationship</span>
            <strong>Best gifts for girlfriends in 2026</strong>
            <p>Low-risk, popular gifts for men buying for a girlfriend right now.</p>
          </a>
          <a class="discovery-link-card" href="/gifts-for-wife/">
            <span>Relationship</span>
            <strong>Best gifts for wives in 2026</strong>
            <p>Higher-confidence gift picks for wives with stronger quality and daily-use upside.</p>
          </a>
          <a class="discovery-link-card" href="/anniversary-gifts-for-her/">
            <span>Moment</span>
            <strong>Best anniversary gifts for her in 2026</strong>
            <p>Sharper anniversary gifts that feel intentional without getting cheesy.</p>
          </a>
          <a class="discovery-link-card" href="/best-gifts-under-100/">
            <span>Budget</span>
            <strong>Best gifts for her under $100 in 2026</strong>
            <p>The highest-confidence shortlist when you want strong results without premium spend.</p>
          </a>
          <a class="discovery-link-card" href="/tech-gifts-for-her/">
            <span>Angle</span>
            <strong>Tech gifts for her in 2026</strong>
            <p>Cleaner tech gifts that feel current, useful, and safe to buy.</p>
          </a>
          <a class="discovery-link-card" href="/viral-gifts-for-her/">
            <span>Angle</span>
            <strong>Viral gifts for her in 2026</strong>
            <p>Current, shareable gift ideas that still make sense in real life.</p>
          </a>
        </div>
      </section>`;
  const booksProductSection = `      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Book picks</p>
          <h2>Book-ready product pages</h2>
        </div>
        <div class="discovery-link-list">
          <a class="discovery-link-card" href="/booksforher/">
            <span>Guide</span>
            <strong>BooksForHer home</strong>
            <p>The books-only guide hub for Kindle editions, broader fiction picks, boxed sets, and the books-only swipe surface.</p>
          </a>
          <a class="discovery-link-card" href="/gift/fourth-wing-kindle-edition/">
            <span>Kindle</span>
            <strong>Fourth Wing Kindle Edition</strong>
            <p>The clearest current Kindle pick when you want an instantly recognizable fantasy starter.</p>
          </a>
          <a class="discovery-link-card" href="/gift/the-women-kindle-edition/">
            <span>Fiction</span>
            <strong>The Women Kindle Edition</strong>
            <p>A broader emotional fiction pick when you want something less fantasy-coded and more book-club safe.</p>
          </a>
          <a class="discovery-link-card" href="/gift/the-wedding-people-kindle-edition/">
            <span>Cozy</span>
            <strong>The Wedding People Kindle Edition</strong>
            <p>A comfort-read fiction choice when you want a current standalone with easy gift logic.</p>
          </a>
          <a class="discovery-link-card" href="/gift/a-court-of-thorns-and-roses-kindle-edition/">
            <span>BookTok</span>
            <strong>A Court of Thorns and Roses Kindle Edition</strong>
            <p>The proven romantasy classic when you want the older still-famous BookTok lane.</p>
          </a>
          <a class="discovery-link-card" href="/gift/the-empyrean-series-3-book-set/">
            <span>Box set</span>
            <strong>The Empyrean Series 3 Book Set</strong>
            <p>The stronger physical-book move when you want a visible stack and a bigger unwrap moment.</p>
          </a>
          <a class="discovery-link-card" href="/gift/fourth-wing-kindle-edition/">
            <span>Fast buy</span>
            <strong>Start with the fastest Kindle pick</strong>
            <p>Use the Fourth Wing page when the gift needs to be bookish, current, and easy to buy quickly.</p>
          </a>
        </div>
      </section>`;
  const defaultProductSection = `      <section class="discovery-section">
        <div class="discovery-section-head">
          <p class="discovery-kicker">Products</p>
          <h2>Product pages</h2>
        </div>
        <div class="discovery-link-list">
          <a class="discovery-link-card" href="/gift/">
            <span>Hub</span>
            <strong>All product pages</strong>
            <p>The full product index with merchant paths, price bands, and nearby guide context.</p>
          </a>
          <a class="discovery-link-card" href="/gift/digital-picture-frame/">
            <span>Meaningful</span>
            <strong>Digital Picture Frame</strong>
            <p>A safer sentimental product page when you want something personal without getting cheesy.</p>
          </a>
          <a class="discovery-link-card" href="/gift/temperature-control-mug/">
            <span>Daily use</span>
            <strong>Temperature-Control Mug</strong>
            <p>Useful enough to feel safe, premium enough to still read as a gift.</p>
          </a>
          <a class="discovery-link-card" href="/gift/candle-warmer-lamp/">
            <span>Cozy</span>
            <strong>Candle Warmer Lamp</strong>
            <p>An easy apartment-friendly product page with strong home-gift appeal.</p>
          </a>
          <a class="discovery-link-card" href="/gift/kindle-paperwhite-signature-edition/">
            <span>Reader</span>
            <strong>Kindle Paperwhite Signature Edition</strong>
            <p>A quieter premium pick with a clear daily-use case.</p>
          </a>
          <a class="discovery-link-card" href="/gift/ninja-creami-deluxe/">
            <span>Viral</span>
            <strong>Ninja CREAMi Deluxe</strong>
            <p>A bigger current-feeling home gift with stronger presence.</p>
          </a>
          <a class="discovery-link-card" href="/gift/portable-projector/">
            <span>Date night</span>
            <strong>Portable Projector</strong>
            <p>A cleaner product-level route when you want the gift to feel like an experience.</p>
          </a>
        </div>
      </section>`;

  return html
    .replace("<h1>Popular gifts for her, bought fast</h1>", "<h1>Reader gifts for her, bought fast</h1>")
    .replace(
      '<p class="discovery-intro">ShopForHer publishes crawlable gift guides, product pages, trust pages, and date-planning hubs built to answer real buyer moments fast.</p>',
      '<p class="discovery-intro">BooksForHer is the book-first ShopForHer edition for actual books, Kindle editions, and boxed-set picks.</p>'
    )
    .replace(defaultGuideSection, booksGuideSection)
    .replace(defaultProductSection, booksProductSection);
}

async function writeHomeSurfaceAliasPages() {
  let indexHtml;

  try {
    indexHtml = await fs.readFile(distIndexPath, "utf8");
  } catch {
    return;
  }

  const booksSurfaceDir = path.join(distDir, "booksforher");
  const booksSurfaceHtml = applyBooksSurfaceShellCopy(applyHomeSurfaceMeta(indexHtml, "books"));

  await fs.mkdir(booksSurfaceDir, { recursive: true });
  await fs.writeFile(path.join(booksSurfaceDir, "index.html"), booksSurfaceHtml, "utf8");
}

async function configureGoogleSearchConsole() {
  const metaToken = String(process.env.GOOGLE_SITE_VERIFICATION_META || "").trim();
  const verificationFilename = normalizeVerificationFilename(process.env.GOOGLE_SITE_VERIFICATION_FILE || "");
  const explicitFileContent = String(process.env.GOOGLE_SITE_VERIFICATION_FILE_CONTENT || "").trim();
  let indexHtml;

  try {
    indexHtml = await fs.readFile(distIndexPath, "utf8");
  } catch {
    return;
  }

  indexHtml = indexHtml.replace(/\s*<meta name="google-site-verification" content="[^"]*">\s*/g, "\n");

  const metaTag = metaToken
    ? `  <meta name="google-site-verification" content="${escapeHtmlAttribute(metaToken)}">\n`
    : "";

  if (indexHtml.includes("<!-- GOOGLE_SEARCH_CONSOLE_META -->")) {
    indexHtml = indexHtml.replace("  <!-- GOOGLE_SEARCH_CONSOLE_META -->\n", metaTag);
    indexHtml = indexHtml.replace("<!-- GOOGLE_SEARCH_CONSOLE_META -->", metaTag.trimEnd());
  } else if (metaTag) {
    indexHtml = indexHtml.replace("</head>", `${metaTag}</head>`);
  }

  await fs.writeFile(distIndexPath, indexHtml);

  if (!verificationFilename) {
    return;
  }

  const verificationBody = explicitFileContent || `google-site-verification: ${verificationFilename}`;
  await fs.writeFile(path.join(distDir, verificationFilename), `${verificationBody}\n`, "utf8");
  console.log(`Configured Google Search Console verification file: ${verificationFilename}`);
}

await configureGoogleSearchConsole();
await writeHomeSurfaceAliasPages();

if (autosubmitDisabled) {
  console.log("Skipping IndexNow auto-submit: INDEXNOW_AUTOSUBMIT is disabled.");
  process.exit(0);
}

if (!indexNowKey) {
  console.log("Skipping IndexNow auto-submit: INDEXNOW_KEY is not set.");
  process.exit(0);
}

const submitScriptPath = path.join(scriptDir, "submit-indexnow.mjs");
const result = spawnSync(process.execPath, [submitScriptPath], {
  cwd: webRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.status === 0) {
  process.exit(0);
}

if (strictMode) {
  process.exit(result.status || 1);
}

console.warn("IndexNow auto-submit failed after build. Continuing without failing the build.");
process.exit(0);
