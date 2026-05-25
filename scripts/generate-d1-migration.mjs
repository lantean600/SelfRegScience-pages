import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const name = process.argv[2]?.trim() || "0001_init";
const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const outputFile = path.join(migrationsDir, `${name}.sql`);

fs.mkdirSync(migrationsDir, { recursive: true });

const command =
  process.platform === "win32"
    ? `npx.cmd prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
    : `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`;

const result = spawnSync(command, {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: true,
});

if (result.status !== 0) {
  console.error(result.stdout || result.stderr || "Failed to generate D1 migration SQL.");
  process.exit(result.status ?? 1);
}

fs.writeFileSync(outputFile, result.stdout, "utf8");
console.log(`Generated D1 migration: ${path.relative(process.cwd(), outputFile)}`);
