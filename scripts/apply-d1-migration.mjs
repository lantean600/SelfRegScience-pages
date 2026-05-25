import { spawnSync } from "node:child_process";
import path from "node:path";

const target = process.argv[2] === "remote" ? "remote" : "local";
const fileArg = process.argv[3]?.trim() || "prisma/migrations/0001_init.sql";
const databaseName = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim() || "selfregscience";
const file = path.normalize(fileArg);

const command =
  process.platform === "win32"
    ? `npx.cmd wrangler d1 execute ${databaseName} --${target} --file="${file}"`
    : `npx wrangler d1 execute ${databaseName} --${target} --file="${file}"`;

const result = spawnSync(command, {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: true,
});

if (result.status !== 0) {
  console.error(result.stdout || result.stderr || "Failed to apply D1 migration.");
  process.exit(result.status ?? 1);
}

console.log(result.stdout || `Applied D1 migration (${target}).`);
