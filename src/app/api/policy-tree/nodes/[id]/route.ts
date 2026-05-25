import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import {
  updateNodeLayout,
  moveNode,
  extinguishSubtree,
} from "@/lib/domain/policy-tree";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      layoutX?: number;
      layoutY?: number;
      parentId?: string | null;
    }>(request);

    if (body.layoutX != null && body.layoutY != null) {
      const node = await updateNodeLayout(user.id, id, body.layoutX, body.layoutY);
      return jsonOk(node);
    }

    if (body.parentId !== undefined) {
      const node = await moveNode(
        user.id,
        id,
        body.parentId === "" ? null : body.parentId,
      );
      return jsonOk(node);
    }

    return jsonError("INVALID_PATCH");
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "CYCLE_DETECTED")
        return jsonError("移动会产生环，已拒绝", 400);
      if (e.message === "NODE_NOT_FOUND") return jsonError(e.message, 404);
      return jsonError(e.message);
    }
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const extinguished = await extinguishSubtree(user.id, id, "manual_extinguish");
    return jsonOk({ extinguished });
  } catch (e) {
    if (e instanceof Error && e.message === "NODE_NOT_FOUND")
      return jsonError(e.message, 404);
    return jsonError("UNAUTHORIZED", 401);
  }
}
