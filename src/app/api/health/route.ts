import { formatApiError } from "@/lib/format-api-error";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { getDb, getDbRuntimeInfo } from "@/lib/db";
import { resolveSessionSecretAsync } from "@/lib/resolve-session-secret";

export async function GET() {
  try {
    const hasSessionSecret = Boolean(await resolveSessionSecretAsync());
    const runtime = await getDbRuntimeInfo();
    const prisma = await getDb();
    await prisma.user.count();
    return jsonOk({
      ok: true,
      databaseBackend: runtime.databaseBackend,
      hasD1Binding: runtime.hasD1Binding,
      runtimePath: runtime.runtimePath,
      hasSessionSecret,
    });
  } catch (error) {
    console.error("[api/health]", error);
    return jsonError(formatApiError(error), 503);
  }
}
