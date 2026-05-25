import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const provided = process.argv[2]?.trim();
const secret = provided || randomBytes(32).toString("hex");

const result = spawnSync("npx", ["wrangler", "secret", "put", "SESSION_SECRET"], {
  cwd: process.cwd(),
  input: `${secret}\n`,
  encoding: "utf8",
  shell: true,
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Failed to set SESSION_SECRET.");
  process.exit(result.status ?? 1);
}

console.log(
  provided
    ? "SESSION_SECRET updated on Worker selfregscience."
    : "SESSION_SECRET generated and stored on Worker selfregscience.",
);
console.log(
  "If you use Cloudflare Workers Builds (GitHub), also add SESSION_SECRET under Dashboard → Workers → selfregscience → Settings → Variables and Secrets.",
);
