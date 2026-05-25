import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const pagesProject = process.env.CF_PAGES_PROJECT ?? "selfregscience-pages";
const provided = process.argv[2]?.trim();
const secret = provided || randomBytes(32).toString("hex");

const pages = spawnSync(
  "npx",
  ["wrangler", "pages", "secret", "put", "SESSION_SECRET", "--project-name", pagesProject],
  { cwd: process.cwd(), input: `${secret}\n`, encoding: "utf8", shell: true },
);

if (pages.status !== 0) {
  console.error(pages.stderr || pages.stdout || "Failed to set SESSION_SECRET on Pages project.");
  process.exit(pages.status ?? 1);
}

console.log(`SESSION_SECRET set on Pages project ${pagesProject}.`);
console.log(
  "Ensure Worker `selfregscience` uses the same value in Dashboard → Variables and Secrets.",
);
