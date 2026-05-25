import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { createNode, getNetworkSnapshot } from "@/lib/domain/ctdp-node";

export async function GET() {
  try {
    const user = await requireUser();
    const snap = await getNetworkSnapshot(user.id);
    return jsonOk(snap.nodes);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      title: string;
      refTargetId?: string | null;
      layoutX?: number;
      layoutY?: number;
    }>(request);
    const node = await createNode({
      userId: user.id,
      title: body.title,
      refTargetId: body.refTargetId,
      layoutX: body.layoutX,
      layoutY: body.layoutY,
    });
    return jsonOk(node);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("UNAUTHORIZED", 401);
    }
    return jsonError(e instanceof Error ? e.message : "BAD_REQUEST", 400);
  }
}
