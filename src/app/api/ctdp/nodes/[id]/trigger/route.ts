import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { triggerNodeExecution } from "@/lib/domain/ctdp-node";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{ mode?: "standard" | "scout" }>(request).catch(
      () => ({} as { mode?: "standard" | "scout" }),
    );
    const node = await triggerNodeExecution(user.id, id, body.mode ?? "standard");
    return jsonOk(node);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("UNAUTHORIZED", 401);
    }
    return jsonError(e instanceof Error ? e.message : "BAD_REQUEST", 400);
  }
}
