import { getCloudflareContext } from "@opennextjs/cloudflare";
import { assertAsciiEnv } from "@/lib/ascii-env";

const DEV_FALLBACK_SECRET = "dev-insecure-session-secret";

function isCloudflareWorkerRuntime(): boolean {
  return Boolean((globalThis as { WebSocketPair?: unknown }).WebSocketPair);
}

function secretFromCloudflareEnv(env: { SESSION_SECRET?: unknown } | null | undefined): string | undefined {
  const value = typeof env?.SESSION_SECRET === "string" ? env.SESSION_SECRET.trim() : "";
  return value || undefined;
}

function cacheSessionSecret(secret: string): string {
  process.env.SESSION_SECRET = secret;
  return secret;
}

/** OpenNext copies env with Object.entries; secrets need direct property access. */
export function mirrorSessionSecretToProcessEnv(env: { SESSION_SECRET?: unknown } | null | undefined): void {
  const secret = secretFromCloudflareEnv(env);
  if (secret) cacheSessionSecret(secret);
}

function readSessionSecretFromOpenNextContext(): string | undefined {
  if (!isCloudflareWorkerRuntime()) return undefined;

  try {
    const { env } = getCloudflareContext({ async: false });
    const secret = secretFromCloudflareEnv(env);
    return secret ? cacheSessionSecret(secret) : undefined;
  } catch {
    return undefined;
  }
}

/** Read secret from process.env or Cloudflare `env` (sync — call before other awaits). */
export function resolveSessionSecret(): string | undefined {
  const fromProcess = process.env.SESSION_SECRET?.trim();
  if (fromProcess) return fromProcess;

  return readSessionSecretFromOpenNextContext();
}

/** Fallback when sync context is unavailable after earlier awaits. */
export async function resolveSessionSecretAsync(): Promise<string | undefined> {
  const fromProcess = process.env.SESSION_SECRET?.trim();
  if (fromProcess) return fromProcess;

  const fromSync = resolveSessionSecret();
  if (fromSync) return fromSync;

  try {
    const { env } = await getCloudflareContext({ async: true });
    const secret = secretFromCloudflareEnv(env);
    return secret ? cacheSessionSecret(secret) : undefined;
  } catch {
    return undefined;
  }
}

/** Resolve at Route Handler entry; pass the result into attachSessionCookie. */
export async function requireSessionSecretForRequest(): Promise<string> {
  const secret = await resolveSessionSecretAsync();
  if (secret) return assertAsciiEnv("SESSION_SECRET", secret);

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  return DEV_FALLBACK_SECRET;
}
