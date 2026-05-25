import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { todayInTimezone } from "@/lib/date-utils";
import { resolveViolation } from "@/lib/domain/precedent-engine";
import { updateHabitOnSatisfaction } from "@/lib/domain/habit-progress";
import { evaluatePolicyGroups } from "@/lib/domain/policy-group";

export async function getOrCreateActiveTree(userId: string) {
  let tree = await prisma.policyTree.findFirst({
    where: { userId, isActive: true },
    include: {
      nodes: {
        where: { status: "active" },
        include: { policy: true, children: true },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!tree) {
    tree = await prisma.policyTree.create({
      data: { userId, slotName: "default", isActive: true },
      include: {
        nodes: {
          where: { status: "active" },
          include: { policy: true, children: true },
          orderBy: { position: "asc" },
        },
      },
    });
  }
  return tree;
}

export async function addPolicyNode(params: {
  userId: string;
  policyId: string;
  parentId?: string;
  groupId?: string;
}) {
  const tree = await getOrCreateActiveTree(params.userId);
  const today = todayInTimezone("Asia/Shanghai");

  const addedToday = await prisma.policyTreeNode.count({
    where: {
      treeId: tree.id,
      addedOnDate: today,
      status: "active",
    },
  });
  if (addedToday >= 1) {
    throw new Error("DAILY_ADD_LIMIT");
  }

  const maxPos = await prisma.policyTreeNode.aggregate({
    where: { treeId: tree.id },
    _max: { position: true },
  });

  const node = await prisma.policyTreeNode.create({
    data: {
      treeId: tree.id,
      policyId: params.policyId,
      parentId: params.parentId ?? null,
      groupId: params.groupId ?? null,
      position: (maxPos._max.position ?? 0) + 1,
      addedOnDate: today,
      status: "active",
    },
    include: { policy: true },
  });

  await logEvent(params.userId, "POLICY_NODE_ADDED", {
    nodeId: node.id,
    policyId: params.policyId,
  });

  return node;
}

export async function extinguishSubtree(
  userId: string,
  nodeId: string,
  reasonTag?: string,
  notes?: string,
) {
  const node = await prisma.policyTreeNode.findFirst({
    where: { id: nodeId, tree: { userId } },
    include: { tree: true },
  });
  if (!node) throw new Error("NODE_NOT_FOUND");

  const toExtinguish = await collectDescendants(nodeId);
  toExtinguish.push(nodeId);

  await prisma.policyTreeNode.updateMany({
    where: { id: { in: toExtinguish } },
    data: { status: "extinguished" },
  });

  if (reasonTag) {
    await prisma.collapseRecord.create({
      data: {
        userId,
        nodeId,
        reasonTag,
        notes,
      },
    });
  }

  await evaluatePolicyGroups(userId, node.treeId);

  await logEvent(userId, "POLICY_SUBTREE_EXTINGUISHED", {
    rootNodeId: nodeId,
    count: toExtinguish.length,
  });

  return toExtinguish;
}

async function collectDescendants(nodeId: string): Promise<string[]> {
  const children = await prisma.policyTreeNode.findMany({
    where: { parentId: nodeId, status: "active" },
  });
  const ids: string[] = [];
  for (const c of children) {
    ids.push(c.id);
    ids.push(...(await collectDescendants(c.id)));
  }
  return ids;
}

export async function recordDailyPolicy(params: {
  userId: string;
  nodeId: string;
  satisfied: boolean;
  note?: string;
}) {
  const node = await prisma.policyTreeNode.findFirst({
    where: { id: params.nodeId, tree: { userId: params.userId }, status: "active" },
    include: { policy: true, tree: true },
  });
  if (!node) throw new Error("NODE_NOT_FOUND");

  const today = todayInTimezone("Asia/Shanghai");
  const frozen = await isNodeFrozen(params.userId, node.id, today);
  if (frozen) {
    return { frozen: true, node };
  }

  await prisma.policyDailyLog.upsert({
    where: { nodeId_date: { nodeId: node.id, date: today } },
    create: {
      nodeId: node.id,
      date: today,
      satisfied: params.satisfied,
      note: params.note,
    },
    update: { satisfied: params.satisfied, note: params.note },
  });

  if (params.satisfied) {
    await updateHabitOnSatisfaction(params.userId, node.policyId, today);
  } else {
    const existing = await findPrecedentForPolicy(
      params.userId,
      node.id,
      "daily_failure",
    );
    if (!existing) {
      return {
        requiresVerdict: true,
        node,
        message: "未满足国策，需下必为例：断裂子树或永久允许此类未满足",
      };
    }
    await rollbackPolicyFailure(params.userId, node.id, "daily_failure", params.note);
  }

  await evaluatePolicyGroups(params.userId, node.treeId);
  return { frozen: false, node, requiresVerdict: false };
}

async function isNodeFrozen(userId: string, nodeId: string, date: string) {
  const freezes = await prisma.compartmentFreeze.findMany({
    where: { userId, status: "active" },
  });
  for (const f of freezes) {
    const ids: string[] = JSON.parse(f.affectedNodeIds);
    if (!ids.includes(nodeId)) continue;
    const d = new Date(date);
    if (d >= f.startAt && d <= f.endAt) return true;
  }
  return false;
}

async function findPrecedentForPolicy(
  userId: string,
  nodeId: string,
  behaviorKey: string,
) {
  return prisma.precedent.findUnique({
    where: {
      userId_scopeType_scopeId_behaviorKey: {
        userId,
        scopeType: "POLICY",
        scopeId: nodeId,
        behaviorKey,
      },
    },
  });
}

export async function resolvePolicyViolation(params: {
  userId: string;
  nodeId: string;
  behaviorKey: string;
  verdict: "break_chain" | "allow_permanently";
  description?: string;
}) {
  const result = await resolveViolation({
    userId: params.userId,
    scopeType: "POLICY",
    scopeId: params.nodeId,
    behaviorKey: params.behaviorKey,
    description: params.description,
    verdict: params.verdict,
  });

  if (result.breakRequired) {
    await rollbackPolicyFailure(
      params.userId,
      params.nodeId,
      params.behaviorKey,
      params.description,
    );
  }

  return result;
}

/** C 失败时熄灭 B、C，保留 A（堆栈回滚至父节点子树） */
export async function rollbackPolicyFailure(
  userId: string,
  nodeId: string,
  reasonTag?: string,
  notes?: string,
) {
  const node = await prisma.policyTreeNode.findFirst({
    where: { id: nodeId, tree: { userId } },
  });
  if (!node) throw new Error("NODE_NOT_FOUND");
  const targetId = node.parentId ?? node.id;
  return extinguishSubtree(userId, targetId, reasonTag, notes);
}

export async function updateNodeLayout(
  userId: string,
  nodeId: string,
  layoutX: number,
  layoutY: number,
) {
  const node = await prisma.policyTreeNode.findFirst({
    where: { id: nodeId, tree: { userId } },
  });
  if (!node) throw new Error("NODE_NOT_FOUND");
  return prisma.policyTreeNode.update({
    where: { id: nodeId },
    data: { layoutX, layoutY },
  });
}

async function wouldCreateCycle(
  nodeId: string,
  newParentId: string | null,
): Promise<boolean> {
  if (!newParentId) return false;
  if (newParentId === nodeId) return true;
  let current: string | null = newParentId;
  const visited = new Set<string>();
  while (current) {
    if (current === nodeId) return true;
    if (visited.has(current)) return true;
    visited.add(current);
    const row: { parentId: string | null } | null =
      await prisma.policyTreeNode.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
    current = row?.parentId ?? null;
  }
  return false;
}

export async function moveNode(
  userId: string,
  nodeId: string,
  newParentId: string | null,
) {
  const node = await prisma.policyTreeNode.findFirst({
    where: { id: nodeId, tree: { userId }, status: "active" },
    include: { tree: true },
  });
  if (!node) throw new Error("NODE_NOT_FOUND");

  if (newParentId) {
    const parent = await prisma.policyTreeNode.findFirst({
      where: {
        id: newParentId,
        treeId: node.treeId,
        status: "active",
      },
    });
    if (!parent) throw new Error("PARENT_NOT_FOUND");
  }

  if (await wouldCreateCycle(nodeId, newParentId)) {
    throw new Error("CYCLE_DETECTED");
  }

  const updated = await prisma.policyTreeNode.update({
    where: { id: nodeId },
    data: { parentId: newParentId },
    include: { policy: true },
  });

  await logEvent(userId, "POLICY_NODE_MOVED", {
    nodeId,
    newParentId,
  });

  return updated;
}

export async function dailySettlement(userId: string, timezone: string) {
  const tree = await getOrCreateActiveTree(userId);
  const today = todayInTimezone(timezone);
  const nodes = await prisma.policyTreeNode.findMany({
    where: { treeId: tree.id, status: "active" },
  });

  const pending: string[] = [];
  for (const n of nodes) {
    const log = await prisma.policyDailyLog.findUnique({
      where: { nodeId_date: { nodeId: n.id, date: today } },
    });
    if (!log) pending.push(n.id);
  }

  return { date: today, pendingNodeIds: pending, totalActive: nodes.length };
}
