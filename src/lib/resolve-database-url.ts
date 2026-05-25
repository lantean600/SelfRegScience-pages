import fs from "fs";
import path from "path";

function normalizeSqliteUrl(value: string): string {
  if (value === "file:./dev.db" || value === "file:dev.db") {
    return "file:./prisma/dev.db";
  }
  return value;
}

function readDotEnvValue(key: string): string | undefined {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return undefined;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      if (trimmed.slice(0, eq).trim() !== key) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return normalizeSqliteUrl(value);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Resolve the local SQLite URL used for fallback development/testing. */
export function resolveDatabaseUrl(): string {
  const fromFile = readDotEnvValue("DATABASE_URL");
  const fromEnv = process.env.DATABASE_URL?.trim()
    ? normalizeSqliteUrl(process.env.DATABASE_URL.trim())
    : undefined;

  if (process.env.NODE_ENV === "development" && fromFile?.startsWith("file:")) {
    if (fromEnv && fromEnv !== fromFile && !fromEnv.startsWith("file:")) {
      console.warn(
        "[db] Development: using DATABASE_URL from .env (local SQLite). " +
          "Cloudflare runtime bindings will be used only in preview/production.",
      );
    }
    return fromFile;
  }

  if (fromEnv?.startsWith("file:")) return fromEnv;
  if (fromFile?.startsWith("file:")) return fromFile;
  return "file:./prisma/dev.db";
}
