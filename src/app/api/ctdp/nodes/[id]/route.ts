import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import {
  updateNodeRef,
  updateNodeLayout,
  deleteNode,
} from "@/lib/domain/ctdp-node";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      title?: string;
      refTargetId?: string | null;
      layoutX?: number;
      layoutY?: number;
    }>(request);

    if (body.title !== undefined) {
      await prisma.ctdpNode.updateMany({
        where: { id, network: { userId: user.id } },
        data: { title: body.title },
      });
    }
    if (body.refTargetId !== undefined) {
      await updateNodeRef(user.id, id, body.refTargetId);
    }
    if (body.layoutX !== undefined && body.layoutY !== undefined) {
      await updateNodeLayout(user.id, id, body.layoutX, body.layoutY);
    }

    const node = await prisma.ctdpNode.findFirst({
      where: { id, network: { userId: user.id } },
    });
    return jsonOk(node);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("UNAUTHORIZED", 401);
    }
    return jsonError(e instanceof Error ? e.message : "BAD_REQUEST", 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteNode(user.id, id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("UNAUTHORIZED", 401);
    }
    return jsonError("NOT_FOUND", 404);
  }
}
