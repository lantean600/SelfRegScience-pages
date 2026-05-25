import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      title?: string;
      type?: string;
      difficulty?: number;
      maintenanceCost?: number;
      steadyStateTarget?: string;
      interventionNode?: string;
    }>(request);

    const existing = await prisma.policy.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("POLICY_NOT_FOUND", 404);

    const policy = await prisma.policy.update({
      where: { id },
      data: body,
    });
    return jsonOk(policy);
  } catch {
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

    const existing = await prisma.policy.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("POLICY_NOT_FOUND", 404);

    const activeRef = await prisma.policyTreeNode.findFirst({
      where: {
        policyId: id,
        status: "active",
        tree: { userId: user.id, isActive: true },
      },
    });
    if (activeRef) {
      return jsonError("国策仍在活跃树中，无法删除", 400);
    }

    await prisma.policy.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
