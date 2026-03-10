import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
