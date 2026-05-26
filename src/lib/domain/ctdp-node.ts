import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import {
  buildSnapshot,
  recomputeAllRefCounts,
  computeCompleteness,
  propagateFailure,
  validateNewEdge,
  type CtdpGraphNode,
} from "@/lib/domain/ctdp-graph";
import { createAppointment } from "@/lib/domain/aux-chain";
import { createFocusSession } from "@/lib/domain/focus-session";
import { findPrecedent } from "@/lib/domain/precedent-engine";

export type CtdpNodeState = "initial" | "executing" | "success" | "failed";
export type JudgmentReason = "missed_trigger" | "session_complete";
export type JudgeVerdict = "success" | "rule_fix" | "total_fail";

function toGraphNode(row: {
  id: string;
  state: string;
  refTargetId: string | null;
  refCount: number;
}): CtdpGraphNode {
  return {
    id: row.id,
    state: row.state as CtdpNodeState,
    refTargetId: row.refTargetId,
    refCount: row.refCount,
  };
}

async function loadNetworkNodes(networkId: string) {
  return prisma.ctdpNode.findMany({ where: { networkId } });
}

async function persistMetrics(networkId: string, graph: ReturnType<typeof buildSnapshot>) {
  const completeness = computeCompleteness(graph);
  await prisma.ctdpNetwork.update({
    where: { id: networkId },
    data: { completeness },
  });
  for (const n of graph.values()) {
    await prisma.ctdpNode.update({
      where: { id: n.id },
      data: { refCount: n.refCount, state: n.state },
    });
  }
}

export async function getOrCreateNetwork(userId: string) {
  let network = await prisma.ctdpNetwork.findUnique({
    where: { userId },
    include: { nodes: true, defaultSacredSeat: true },
  });
  if (!network) {
    network = await prisma.ctdpNetwork.create({
      data: { userId },
      include: { nodes: true, defaultSacredSeat: true },
    });
  }
  return network;
}

async function resolveSacredSeatId(userId: string, networkId: string, seatId?: string) {
  if (seatId) return seatId;
  const network = await prisma.ctdpNetwork.findUnique({ where: { id: networkId } });
  if (network?.defaultSacredSeatId) return network.defaultSacredSeatId;
  const seat = await prisma.sacredSeat.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!seat) throw new Error("SACRED_SEAT_REQUIRED");
  await prisma.ctdpNetwork.update({
    where: { id: networkId },
    data: { defaultSacredSeatId: seat.id },
  });
  return seat.id;
}

export async function createNode(params: {
  userId: string;
  title: string;
  refTargetId?: string | null;
  layoutX?: number;
  layoutY?: number;
}) {
  const network = await getOrCreateNetwork(params.userId);
  if (params.refTargetId) {
    const snap = buildSnapshot(
      (await loadNetworkNodes(network.id)).map(toGraphNode),
    );
    if (!snap.has(params.refTargetId)) throw new Error("TARGET_NOT_FOUND");
  }

  const node = await prisma.ctdpNode.create({
    data: {
      networkId: network.id,
      title: params.title,
      refTargetId: params.refTargetId ?? null,
      layoutX: params.layoutX,
      layoutY: params.layoutY,
    },
  });

  const rows = await loadNetworkNodes(network.id);
  const graph = recomputeAllRefCounts(buildSnapshot(rows.map(toGraphNode)));
  await persistMetrics(network.id, graph);
  return prisma.ctdpNode.findUniqueOrThrow({ where: { id: node.id } });
}

export async function updateNodeRef(
  userId: string,
  nodeId: string,
  refTargetId: string | null,
) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: nodeId, network: { userId } },
  });
  if (!node) throw new Error("NOT_FOUND");

  const rows = await loadNetworkNodes(node.networkId);
  const snap = buildSnapshot(rows.map(toGraphNode));
  const v = validateNewEdge(nodeId, refTargetId, snap);
  if (!v.ok) throw new Error(v.reason);

  await prisma.ctdpNode.update({
    where: { id: nodeId },
    data: { refTargetId },
  });

  const graph = recomputeAllRefCounts(
    buildSnapshot((await loadNetworkNodes(node.networkId)).map(toGraphNode)),
  );
  await persistMetrics(node.networkId, graph);
}

export async function updateNodeLayout(
  userId: string,
  nodeId: string,
  layoutX: number,
  layoutY: number,
) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: nodeId, network: { userId } },
  });
  if (!node) throw new Error("NOT_FOUND");
  return prisma.ctdpNode.update({
    where: { id: nodeId },
    data: { layoutX, layoutY },
  });
}

export async function deleteNode(userId: string, nodeId: string) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: nodeId, network: { userId } },
  });
  if (!node) throw new Error("NOT_FOUND");

  await prisma.ctdpNode.updateMany({
    where: { refTargetId: nodeId },
    data: { refTargetId: null },
  });
  await prisma.ctdpNode.delete({ where: { id: nodeId } });

  const graph = recomputeAllRefCounts(
    buildSnapshot((await loadNetworkNodes(node.networkId)).map(toGraphNode)),
  );
  await persistMetrics(node.networkId, graph);
}

export async function armNodeExecution(userId: string, nodeId: string) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: nodeId, network: { userId }, state: "initial" },
    include: { network: true },
  });
  if (!node) throw new Error("INVALID_STATE");
  if (node.pendingAppointmentId) throw new Error("ALREADY_ARMED");

  const seatId = await resolveSacredSeatId(userId, node.networkId, node.sacredSeatId ?? undefined);
  const appt = await createAppointment({
    userId,
    sacredSeatId: seatId,
    signalType: `ctdp-node:${nodeId}`,
    ctdpNodeId: nodeId,
  });

  return prisma.ctdpNode.update({
    where: { id: nodeId },
    data: {
      pendingAppointmentId: appt.id,
      sacredSeatId: seatId,
      awaitingJudgment: false,
      judgmentReason: null,
    },
  });
}

export async function triggerNodeExecution(
  userId: string,
  nodeId: string,
  mode: "standard" | "scout" = "standard",
) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: nodeId, network: { userId } },
  });
  if (!node) throw new Error("NOT_FOUND");
  if (node.state !== "initial") throw new Error("INVALID_STATE");

  const seatId = await resolveSacredSeatId(
    userId,
    node.networkId,
    node.sacredSeatId ?? undefined,
  );

  if (node.pendingAppointmentId) {
    const { fulfillAppointment } = await import("@/lib/domain/aux-chain");
    await fulfillAppointment(userId, node.pendingAppointmentId);
  }

  const session = await createFocusSession({
    userId,
    sacredSeatId: seatId,
    mode,
    ctdpNodeId: nodeId,
  });

  return prisma.ctdpNode.update({
    where: { id: nodeId },
    data: {
      state: "executing",
      activeSessionId: session.id,
      sacredSeatId: seatId,
      awaitingJudgment: false,
      judgmentReason: null,
      pendingAppointmentId: null,
    },
  });
}

export async function handleMissedTriggerDeadline(userId: string, appointmentId: string) {
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, status: "pending" },
    include: { ctdpNode: { include: { network: true } } },
  });
  if (!appt?.ctdpNode || appt.ctdpNode.network.userId !== userId) return null;
  if (appt.ctdpNode.state !== "initial") return null;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "failed" },
  });

  return prisma.ctdpNode.update({
    where: { id: appt.ctdpNode.id },
    data: {
      awaitingJudgment: true,
      judgmentReason: "missed_trigger",
      pendingAppointmentId: null,
    },
  });
}

export async function completeNodeSession(userId: string, sessionId: string) {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session?.ctdpNodeId) throw new Error("NOT_LINKED");

  await prisma.focusSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date() },
  });

  return prisma.ctdpNode.update({
    where: { id: session.ctdpNodeId },
    data: {
      activeSessionId: null,
      awaitingJudgment: true,
      judgmentReason: "session_complete",
    },
  });
}

export async function abandonNodeExecution(userId: string, nodeId: string) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: nodeId, network: { userId }, state: "executing" },
  });
  if (!node) throw new Error("INVALID_STATE");

  if (node.activeSessionId) {
    await prisma.focusSession.update({
      where: { id: node.activeSessionId },
      data: { status: "cancelled", completedAt: new Date() },
    });
  }

  await prisma.ctdpNode.update({
    where: { id: nodeId },
    data: {
      state: "failed",
      activeSessionId: null,
      awaitingJudgment: false,
      judgmentReason: null,
      pendingAppointmentId: null,
    },
  });

  const rows = await loadNetworkNodes(node.networkId);
  let graph = buildSnapshot(rows.map(toGraphNode));
  graph = propagateFailure(nodeId, graph);
  await persistMetrics(node.networkId, graph);

  await logEvent(userId, "CTDP_NODE_ABANDONED", { nodeId });
  return prisma.ctdpNode.findUniqueOrThrow({ where: { id: nodeId } });
}

export async function judgeNode(params: {
  userId: string;
  nodeId: string;
  verdict: JudgeVerdict;
  ruleText?: string;
  behaviorKey?: string;
}) {
  const node = await prisma.ctdpNode.findFirst({
    where: { id: params.nodeId, network: { userId: params.userId } },
  });
  if (!node) throw new Error("NOT_FOUND");
  if (!node.awaitingJudgment) throw new Error("NOT_AWAITING_JUDGMENT");

  const clearJudgment = {
    awaitingJudgment: false,
    judgmentReason: null,
    pendingAppointmentId: null,
    activeSessionId: null,
  };

  if (params.verdict === "success") {
    await prisma.ctdpNode.update({
      where: { id: params.nodeId },
      data: { ...clearJudgment, state: "success" },
    });
  } else if (params.verdict === "rule_fix") {
    const rule = params.ruleText?.trim() ?? "";
    const behaviorKey = params.behaviorKey ?? "rule_exception";
    const nextRule = [node.judgmentRule, rule].filter(Boolean).join("\n");
    if (rule) {
      const existing = await findPrecedent(
        params.userId,
        "CTDP_NODE",
        params.nodeId,
        behaviorKey,
      );
      if (!existing) {
        await prisma.precedent.create({
          data: {
            userId: params.userId,
            scopeType: "CTDP_NODE",
            scopeId: params.nodeId,
            behaviorKey,
            description: rule,
          },
        });
      }
    }
    await prisma.ctdpNode.update({
      where: { id: params.nodeId },
      data: { ...clearJudgment, state: "success", judgmentRule: nextRule },
    });
  } else {
    await prisma.ctdpNode.update({
      where: { id: params.nodeId },
      data: { ...clearJudgment, state: "failed" },
    });
    const rows = await loadNetworkNodes(node.networkId);
    let graph = buildSnapshot(rows.map(toGraphNode));
    graph = propagateFailure(params.nodeId, graph);
    await persistMetrics(node.networkId, graph);
  }

  const rows = await loadNetworkNodes(node.networkId);
  const graph = recomputeAllRefCounts(buildSnapshot(rows.map(toGraphNode)));
  await persistMetrics(node.networkId, graph);

  await logEvent(params.userId, "CTDP_NODE_JUDGED", {
    nodeId: params.nodeId,
    verdict: params.verdict,
  });

  return prisma.ctdpNode.findUniqueOrThrow({ where: { id: params.nodeId } });
}

export async function getNetworkSnapshot(userId: string) {
  const network = await getOrCreateNetwork(userId);
  const nodes = await prisma.ctdpNode.findMany({
    where: { networkId: network.id },
    include: {
      appointments: {
        where: { status: "pending" },
        orderBy: { deadlineAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sessionIds = nodes
    .map((n) => n.activeSessionId)
    .filter((id): id is string => Boolean(id));

  const sessions =
    sessionIds.length > 0
      ? await prisma.focusSession.findMany({
          where: { id: { in: sessionIds }, status: "focusing" },
          select: { id: true, startedAt: true, triggeredAt: true, targetMinutes: true },
        })
      : [];

  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const enrichedNodes = nodes.map((n) => {
    const session = n.activeSessionId ? sessionById.get(n.activeSessionId) : undefined;
    return {
      ...n,
      activeSession: session
        ? {
            startedAt: session.startedAt ?? session.triggeredAt,
            targetMinutes: session.targetMinutes,
          }
        : null,
    };
  });

  const inDegree = new Map<string, number>();
  for (const n of enrichedNodes) {
    if (n.refTargetId) {
      inDegree.set(n.refTargetId, (inDegree.get(n.refTargetId) ?? 0) + 1);
    }
  }

  return {
    network,
    nodes: enrichedNodes,
    inDegree: Object.fromEntries(inDegree),
  };
}

export async function processCtdpOverdueAppointments(userId: string) {
  const now = new Date();
  const overdue = await prisma.appointment.findMany({
    where: {
      status: "pending",
      deadlineAt: { lt: now },
      ctdpNodeId: { not: null },
      auxChain: { userId },
    },
  });
  const handled: string[] = [];
  for (const a of overdue) {
    const result = await handleMissedTriggerDeadline(userId, a.id);
    if (result) handled.push(a.id);
  }
  return handled;
}
