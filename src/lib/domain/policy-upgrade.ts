import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";

export async function upgradePolicy(
  userId: string,
  policyId: string,
  success: boolean,
) {
  const policy = await prisma.policy.findFirst({
    where: { id: policyId, userId, isUpgradeable: true },
  });
  if (!policy) throw new Error("NOT_UPGRADEABLE");

  let upgrade = await prisma.policyUpgrade.findUnique({
    where: { policyId },
  });
  if (!upgrade) {
    upgrade = await prisma.policyUpgrade.create({
      data: { policyId, level: 0, paramsJson: "{}" },
    });
  }

  const newLevel = success
    ? upgrade.level + 1
    : Math.max(0, upgrade.level - 1);

  const updated = await prisma.policyUpgrade.update({
    where: { policyId },
    data: { level: newLevel },
  });

  await logEvent(userId, success ? "POLICY_UPGRADED" : "POLICY_DOWNGRADED", {
    policyId,
    level: newLevel,
  });

  return updated;
}
