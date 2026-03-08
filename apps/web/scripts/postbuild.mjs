import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const autosubmitSetting = String(process.env.INDEXNOW_AUTOSUBMIT || "").trim().toLowerCase();
const strictSetting = String(process.env.INDEXNOW_STRICT || "").trim().toLowerCase();
const autosubmitDisabled = ["0", "false", "no", "off"].includes(autosubmitSetting);
const strictMode = ["1", "true", "yes", "on"].includes(strictSetting);
const indexNowKey = String(process.env.INDEXNOW_KEY || "").trim();

if (autosubmitDisabled) {
  console.log("Skipping IndexNow auto-submit: INDEXNOW_AUTOSUBMIT is disabled.");
  process.exit(0);
}

if (!indexNowKey) {
  console.log("Skipping IndexNow auto-submit: INDEXNOW_KEY is not set.");
  process.exit(0);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const submitScriptPath = path.join(scriptDir, "submit-indexnow.mjs");
const result = spawnSync(process.execPath, [submitScriptPath], {
  cwd: path.join(scriptDir, ".."),
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
