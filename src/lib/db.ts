import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext, type CloudflareContext } from "@opennextjs/cloudflare";
import { resolveDatabaseUrl } from "@/lib/resolve-database-url";
import { mirrorSessionSecretToProcessEnv } from "@/lib/resolve-session-secret";

type GlobalPrismaState = {
  sqlitePrisma?: PrismaClient;
  sqlitePrismaPromise?: Promise<PrismaClient>;
  d1PrismaByBinding?: WeakMap<object, PrismaClient>;
};

type DbRuntimeInfo = {
  databaseBackend: "d1" | "sqlite-file";
  hasD1Binding: boolean;
  runtimePath: "cloudflare-d1" | "local-sqlite";
  cloudflareContext: CloudflareContext | null;
};

const globalForPrisma = globalThis as unknown as GlobalPrismaState;

function prismaLog(): Prisma.LogLevel[] {
  return process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
}

function isCloudflareWorkerRuntime(): boolean {
  return Boolean((globalThis as { WebSocketPair?: unknown }).WebSocketPair);
}

function shouldRequireCloudflareDbBinding(): boolean {
  return (
    isCloudflareWorkerRuntime() ||
    process.env.CF_PAGES === "1" ||
    process.env.OPEN_NEXT_CLOUDFLARE_DEV === "1" ||
    Boolean(process.env.NEXT_DEV_WRANGLER_ENV)
  );
}

function requireNodeOnly<T>(specifier: string): T {
  const getBuiltinModule = (
    process as typeof process & {
      getBuiltinModule?: (id: string) => unknown;
    }
  ).getBuiltinModule;
  const moduleApi = getBuiltinModule?.("node:module") as typeof import("node:module") | undefined;
  if (!moduleApi) {
    throw new Error(`Node-only module \`${specifier}\` is unavailable in this runtime.`);
  }
  return moduleApi.createRequire(import.meta.url)(specifier) as T;
}

async function getSqlitePrisma(): Promise<PrismaClient> {
  const existing = globalForPrisma.sqlitePrisma;
  if (existing) return existing;

  const pending = globalForPrisma.sqlitePrismaPromise;
  if (pending) return pending;

  const promise = (async () => {
    const { PrismaLibSql } =
      requireNodeOnly<typeof import("@prisma/adapter-libsql")>("@prisma/adapter-libsql");
    const prisma = new PrismaClient({
      adapter: new PrismaLibSql({ url: resolveDatabaseUrl() }) as never,
      log: prismaLog(),
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.sqlitePrisma = prisma;
    }
    return prisma;
  })();

  globalForPrisma.sqlitePrismaPromise = promise;
  try {
    return await promise;
  } finally {
    if (globalForPrisma.sqlitePrismaPromise === promise) {
      delete globalForPrisma.sqlitePrismaPromise;
    }
  }
}

function getD1PrismaFromBinding(binding: NonNullable<CloudflareEnv["DB"]>): PrismaClient {
  const cache = globalForPrisma.d1PrismaByBinding ??= new WeakMap();
  const existing = cache.get(binding as object);
  if (existing) return existing;

  const prisma = new PrismaClient({
    adapter: new PrismaD1(binding) as never,
    log: prismaLog(),
  });
  cache.set(binding as object, prisma);
  return prisma;
}

async function getCloudflareDbContext(): Promise<CloudflareContext | null> {
  try {
    // In the deployed Worker, context lives on ALS; sync avoids the nodejs→wrangler fallback path.
    if (isCloudflareWorkerRuntime()) {
      const context = getCloudflareContext({ async: false });
      mirrorSessionSecretToProcessEnv(context.env);
      return context;
    }
    const context = await getCloudflareContext({ async: true });
    mirrorSessionSecretToProcessEnv(context.env);
    return context;
  } catch (error) {
    if (shouldRequireCloudflareDbBinding()) {
      throw new Error("Cloudflare runtime context is unavailable; cannot resolve D1 binding.", {
        cause: error,
      });
    }
    return null;
  }
}

async function resolveDbRuntimeInfo(): Promise<DbRuntimeInfo> {
  if (!shouldRequireCloudflareDbBinding()) {
    return {
      databaseBackend: "sqlite-file",
      hasD1Binding: false,
      runtimePath: "local-sqlite",
      cloudflareContext: null,
    };
  }

  const cloudflareContext = await getCloudflareDbContext();
  if (cloudflareContext?.env.DB) {
    return {
      databaseBackend: "d1",
      hasD1Binding: true,
      runtimePath: "cloudflare-d1",
      cloudflareContext,
    };
  }

  throw new Error("Cloudflare D1 binding `DB` is not configured.");
}

export async function getDbRuntimeInfo(): Promise<Omit<DbRuntimeInfo, "cloudflareContext">> {
  const { databaseBackend, hasD1Binding, runtimePath } = await resolveDbRuntimeInfo();
  return { databaseBackend, hasD1Binding, runtimePath };
}

export async function getDb(): Promise<PrismaClient> {
  const runtime = await resolveDbRuntimeInfo();
  if (runtime.cloudflareContext?.env.DB) {
    return getD1PrismaFromBinding(runtime.cloudflareContext.env.DB);
  }
  return await getSqlitePrisma();
}

function createLazyPrismaProxy(path: PropertyKey[] = []): unknown {
  return new Proxy(function prismaProxy() {}, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return createLazyPrismaProxy([...path, prop]);
    },
    apply(_target, _thisArg, argArray) {
      return getDb().then((db) => {
        let owner: unknown = db;
        let target: unknown = db;
        for (const key of path) {
          owner = target;
          target = (target as Record<PropertyKey, unknown>)[key];
        }
        if (typeof target !== "function") return target;
        return target.apply(owner, argArray);
      });
    },
  });
}

export const prisma = createLazyPrismaProxy() as PrismaClient;
