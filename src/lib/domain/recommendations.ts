import { prisma } from "@/lib/db";

export async function getSurroundCityAdvice(userId: string, policyId: string) {
  const policy = await prisma.policy.findFirst({
    where: { id: policyId, userId },
  });
  if (!policy) return null;

  const failures = await prisma.collapseRecord.count({
    where: {
      userId,
      node: { policyId },
    },
  });

  if (policy.difficulty >= 4 && failures >= 2) {
    const easyPolicies = await prisma.policy.findMany({
      where: { userId, difficulty: { lte: 2 } },
      take: 5,
    });
    return {
      type: "surround_city",
      message:
        "该高难度国策多次失败。建议先点亮低难度、看似无关的「农村」国策，改善边界条件后再攻此「城市」。",
      suggestedPolicyIds: easyPolicies.map((p) => p.id),
    };
  }
  return null;
}

export async function linkPolicyToCtdpNode(userId: string, policyId: string) {
  const policy = await prisma.policy.findFirst({
    where: { id: policyId, userId, type: "semi_passive" },
  });
  if (!policy) return null;

  let trigger: { event?: string } = {};
  try {
    trigger = JSON.parse(policy.triggerJson ?? "{}");
  } catch {
    /* ignore */
  }

  if (trigger.event === "return_home") {
    const { createNode, armNodeExecution } = await import("@/lib/domain/ctdp-node");
    const node = await createNode({
      userId,
      title: `国策：${policy.title}`,
    });
    return armNodeExecution(userId, node.id);
  }
  return null;
}
