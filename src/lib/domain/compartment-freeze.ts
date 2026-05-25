import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { extinguishSubtree } from "@/lib/domain/policy-tree";

export async function createCompartmentFreeze(params: {
  userId: string;
  reason: string;
  startAt: Date;
  endAt: Date;
  affectedNodeIds: string[];
  precedentKey?: string;
}) {
  const freeze = await prisma.compartmentFreeze.create({
    data: {
      userId: params.userId,
      reason: params.reason,
      precedentKey: params.precedentKey,
      startAt: params.startAt,
      endAt: params.endAt,
      affectedNodeIds: JSON.stringify(params.affectedNodeIds),
      status: "active",
    },
  });

  await logEvent(params.userId, "COMPARTMENT_FREEZE_STARTED", {
    freezeId: freeze.id,
  });

  return freeze;
}

export async function processUnfreeze(userId: string, freezeId: string) {
  const freeze = await prisma.compartmentFreeze.findFirst({
    where: { id: freezeId, userId },
  });
  if (!freeze) throw new Error("NOT_FOUND");

  const nodeIds: string[] = JSON.parse(freeze.affectedNodeIds);
  const today = new Date().toISOString().slice(0, 10);
  const results: { nodeId: string; satisfied: boolean }[] = [];

  for (const nodeId of nodeIds) {
    const log = await prisma.policyDailyLog.findUnique({
      where: { nodeId_date: { nodeId, date: today } },
    });
    const satisfied = log?.satisfied ?? false;
    results.push({ nodeId, satisfied });
    if (!satisfied) {
      await extinguishSubtree(userId, nodeId, "unfreeze_failed");
    }
  }

  await prisma.compartmentFreeze.update({
    where: { id: freezeId },
    data: { status: "closed" },
  });

  await logEvent(userId, "COMPARTMENT_UNFROZEN", { freezeId, results });

  return results;
}
