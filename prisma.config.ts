import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

function normalizeSqliteUrl(value: string): string {
  if (value === "file:./dev.db" || value === "file:dev.db") {
    return "file:./prisma/dev.db";
  }
  return value;
}

function readDotEnvDatabaseUrl(): string | undefined {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return undefined;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq).trim() !== "DATABASE_URL") continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return normalizeSqliteUrl(value);
  }

  return undefined;
}

function resolveLocalDatabaseUrl(): string {
  const fromFile = readDotEnvDatabaseUrl();
  if (fromFile?.startsWith("file:")) return fromFile;

  const fromEnv = process.env.DATABASE_URL?.trim()
    ? normalizeSqliteUrl(process.env.DATABASE_URL.trim())
    : undefined;
  if (fromEnv?.startsWith("file:")) return fromEnv;

  return "file:./prisma/dev.db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveLocalDatabaseUrl(),
  },
});
