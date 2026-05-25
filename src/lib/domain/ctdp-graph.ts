/** In-memory graph node for CTDP forest algorithms (no Prisma). */
export type CtdpGraphNode = {
  id: string;
  state: "initial" | "executing" | "success" | "failed";
  refTargetId: string | null;
  refCount: number;
};

export type CtdpGraphSnapshot = Map<string, CtdpGraphNode>;

export function buildSnapshot(nodes: CtdpGraphNode[]): CtdpGraphSnapshot {
  return new Map(nodes.map((n) => [n.id, { ...n }]));
}

export function computeRefCount(
  nodeId: string,
  nodes: CtdpGraphSnapshot,
  memo = new Map<string, number>(),
): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!;
  const node = nodes.get(nodeId);
  if (!node?.refTargetId) {
    memo.set(nodeId, 0);
    return 0;
  }
  const count = 1 + computeRefCount(node.refTargetId, nodes, memo);
  memo.set(nodeId, count);
  return count;
}

export function recomputeAllRefCounts(nodes: CtdpGraphSnapshot): CtdpGraphSnapshot {
  const next = buildSnapshot([...nodes.values()]);
  for (const id of next.keys()) {
    const n = next.get(id)!;
    n.refCount = computeRefCount(id, next);
  }
  return next;
}

export function computeCompleteness(nodes: CtdpGraphSnapshot): number {
  let successSum = 0;
  let totalSum = 0;
  for (const n of nodes.values()) {
    totalSum += n.refCount;
    if (n.state === "success") successSum += n.refCount;
  }
  if (totalSum === 0) return 0;
  return successSum / totalSum;
}

export function incomingCount(nodeId: string, nodes: CtdpGraphSnapshot): number {
  let count = 0;
  for (const n of nodes.values()) {
    if (n.refTargetId === nodeId) count++;
  }
  return count;
}

/**
 * Propagate failure along out-edges from failedNodeId.
 * success/executing → failed; initial unchanged.
 * Stop traversing past a node with in-degree >= 2 (after processing that node).
 */
export function propagateFailure(
  failedNodeId: string,
  nodes: CtdpGraphSnapshot,
): CtdpGraphSnapshot {
  const next = buildSnapshot([...nodes.values()]);
  let current = next.get(failedNodeId)?.refTargetId ?? null;

  while (current) {
    const node = next.get(current);
    if (!node) break;

    if (node.state === "success" || node.state === "executing") {
      node.state = "failed";
    }

    const inDeg = incomingCount(current, next);
    if (inDeg >= 2) break;

    current = node.refTargetId;
  }

  return next;
}

export function validateNewEdge(
  nodeId: string,
  targetId: string | null,
  nodes: CtdpGraphSnapshot,
): { ok: true } | { ok: false; reason: string } {
  if (targetId === null) return { ok: true };
  if (nodeId === targetId) return { ok: false, reason: "SELF_REFERENCE" };
  if (!nodes.has(targetId)) return { ok: false, reason: "TARGET_NOT_FOUND" };

  let walk: string | null = targetId;
  while (walk) {
    if (walk === nodeId) return { ok: false, reason: "CYCLE" };
    walk = nodes.get(walk)?.refTargetId ?? null;
  }
  return { ok: true };
}
