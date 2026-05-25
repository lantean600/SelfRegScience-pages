/**
 * After opennextjs-cloudflare build:
 * - Keep static assets in .open-next/assets
 * - Install a thin Pages Functions worker that forwards to the full OpenNext Worker
 *   (avoids Pages re-bundling the heavy worker.js and breaking Prisma WASM).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const openNextDir = join(root, ".open-next");
const assetsDir = join(openNextDir, "assets");
const workerDest = join(openNextDir, "_worker.js");
const routesPath = join(openNextDir, "_routes.json");

const API_SERVICE = process.env.CF_PAGES_API_SERVICE ?? "selfregscience";

mkdirSync(assetsDir, { recursive: true });

writeFileSync(
  workerDest,
  `export default {
  async fetch(request, env, ctx) {
    const api = env.API;
    if (!api || typeof api.fetch !== "function") {
      return new Response("Pages API service binding missing (API → ${API_SERVICE})", {
        status: 503,
      });
    }
    return api.fetch(request);
  },
};
`,
  "utf8",
);

// All routes (including /_next/static) go through the thin proxy → Worker ASSETS,
// so HTML and static chunks share the same OpenNext build (no Pages/Worker split).
writeFileSync(
  routesPath,
  JSON.stringify(
    {
      version: 1,
      include: ["/*"],
      exclude: [],
    },
    null,
    2,
  ),
  "utf8",
);

console.log("Pages proxy worker ready:", workerDest);
console.log("Forward binding: API →", API_SERVICE);
