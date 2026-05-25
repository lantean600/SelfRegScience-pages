import type { Edge } from "@xyflow/react";
import { applyDagreLayout, mergeSavedPositions } from "@/components/canvas/useDagreLayout";
import type { CanvasNode } from "@/components/canvas/types";
import type { RsipPolicy, RsipTreeNode } from "@/components/rsip/RsipDataContext";

export function buildRsipCanvasGraph({
  treeNodes,
  policies,
  today,
}: {
  treeNodes: RsipTreeNode[];
  policies: RsipPolicy[];
  today: string;
}) {
  const activePolicyIds = new Set(
    treeNodes.filter((node) => node.status === "active").map((node) => node.policy.id),
  );
  const orphans = policies.filter((policy) => !activePolicyIds.has(policy.id));
  const nodes: CanvasNode[] = [];
  const edges: Edge[] = [];
  const saved = new Map<string, { x: number; y: number }>();

  const activeNodes = treeNodes.filter((node) => node.status === "active");
  const roots = activeNodes.filter((node) => !node.parentId);

  activeNodes.forEach((node) => {
    const id = `pnode-${node.id}`;

    if (node.layoutX != null && node.layoutY != null) {
      saved.set(id, { x: node.layoutX, y: node.layoutY });
    }

    const isRoot = !node.parentId;
    nodes.push({
      id,
      type: isRoot ? "policyRoot" : "policy",
      position: { x: 0, y: 0 },
      data: {
        kind: isRoot ? "policyRoot" : "policy",
        label: node.policy.title,
        sublabel: node.addedOnDate === today ? "今日点亮" : undefined,
        entityId: node.id,
        meta: {
          type: node.policy.type,
          status: node.status,
          policyId: node.policy.id,
          nodeId: node.id,
        },
      },
    });

    if (!node.parentId) return;

    edges.push({
      id: `stack-${node.parentId}-${node.id}`,
      source: `pnode-${node.parentId}`,
      target: id,
      type: "stack",
    });
  });

  orphans.forEach((policy, index) => {
    nodes.push({
      id: `orphan-${policy.id}`,
      type: "policyOrphan",
      position: { x: -200, y: index * 90 },
      data: {
        kind: "policyOrphan",
        label: policy.title,
        sublabel: "拖入树上以挂载",
        entityId: policy.id,
        meta: { type: policy.type, status: "orphan" },
      },
    });
  });

  if (roots.length === 0 && activeNodes.length === 0 && orphans.length > 0) {
    return { nodes, edges, orphans };
  }

  const laidOutNodes = applyDagreLayout(mergeSavedPositions(nodes, saved), edges, "TB");
  return { nodes: laidOutNodes, edges, orphans };
}
