import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { extinguishSubtree } from "@/lib/domain/policy-tree";

export async function evaluatePolicyGroups(userId: string, treeId: string) {
  const groups = await prisma.policyGroup.findMany({
    where: { userId },
    include: { members: true, nodes: { where: { treeId, status: "active" } } },
  });

  for (const group of groups) {
    const memberPolicyIds = group.members.map((m) => m.policyId);
    const activeNodes = await prisma.policyTreeNode.findMany({
      where: {
        treeId,
        status: "active",
        policyId: { in: memberPolicyIds },
      },
    });

    if (activeNodes.length === 0) continue;

    const extinguishedCount = await prisma.policyTreeNode.count({
      where: {
        treeId,
        policyId: { in: memberPolicyIds },
        status: "extinguished",
        addedOnDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      },
    });

    const failedToday = await countGroupFailuresToday(treeId, memberPolicyIds);
    if (failedToday > group.faultQuota) {
      const parentNode = group.nodes[0];
      if (parentNode) {
        await extinguishSubtree(userId, parentNode.id, "group_quota_exceeded");
        await logEvent(userId, "POLICY_GROUP_FAILED", { groupId: group.id });
      }
    }
  }
}

async function countGroupFailuresToday(treeId: string, policyIds: string[]) {
  const today = new Date().toISOString().slice(0, 10);
  const logs = await prisma.policyDailyLog.findMany({
    where: {
      date: today,
      satisfied: false,
      node: { treeId, policyId: { in: policyIds } },
    },
  });
  return logs.length;
}

export async function createPolicyGroup(params: {
  userId: string;
  name: string;
  faultQuota: number;
  policyIds: string[];
}) {
  const group = await prisma.policyGroup.create({
    data: {
      userId: params.userId,
      name: params.name,
      faultQuota: params.faultQuota,
      members: {
        create: params.policyIds.map((policyId) => ({ policyId })),
      },
    },
    include: { members: true },
  });
  return group;
}
