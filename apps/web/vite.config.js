import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const dateSpotsFunctionPath = path.join(repoRoot, "functions/api/date-spots.js");
const devVarsPath = path.join(repoRoot, ".dev.vars");

function parseEnvFile(source) {
  return source.split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return env;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 0) {
      return env;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const quoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"));

    env[key] = quoted ? rawValue.slice(1, -1) : rawValue;
    return env;
  }, {});
}

async function loadPagesEnv() {
  try {
    const raw = await fs.readFile(devVarsPath, "utf8");
    return {
      ...process.env,
      ...parseEnvFile(raw),
    };
  } catch (error) {
    return { ...process.env };
  }
}

function toWebRequest(req) {
  const origin = `http://${req.headers.host || "127.0.0.1:4173"}`;
  const requestUrl = new URL(req.originalUrl || req.url || "/", origin);
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
      return;
    }

    if (value !== undefined) {
      headers.set(key, value);
    }
  });

  return new Request(requestUrl, {
    method: req.method || "GET",
    headers,
  });
}

async function sendNodeResponse(nodeResponse, webResponse) {
  nodeResponse.statusCode = webResponse.status;

  webResponse.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

  const body = Buffer.from(await webResponse.arrayBuffer());
  nodeResponse.end(body);
}

function dateSpotsDevPlugin() {
  return {
    name: "giftsher-date-spots-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestPath = req.url ? req.url.split("?")[0] : "";

        if (req.method !== "GET" || requestPath !== "/api/date-spots") {
          next();
          return;
        }

        try {
          const env = await loadPagesEnv();
          const moduleUrl = `${pathToFileURL(dateSpotsFunctionPath).href}?t=${Date.now()}`;
          const { onRequestGet } = await import(moduleUrl);

          if (typeof onRequestGet !== "function") {
            throw new Error("functions/api/date-spots.js does not export onRequestGet");
          }

          const response = await onRequestGet({
            request: toWebRequest(req),
            env,
          });

          await sendNodeResponse(res, response);
        } catch (error) {
          server.ssrFixStacktrace(error);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              ok: false,
              error: "date-spots-dev-error",
              message: error instanceof Error ? error.message : "Unknown dev middleware error",
            })
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), dateSpotsDevPlugin()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), repoRoot],
    },
  },
});
