import { MarkerType, type Edge } from "@xyflow/react";
import type { CtdpForceLayoutMeta } from "@/components/canvas/CtdpForceController";
import type { CanvasNode } from "@/components/canvas/types";
import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";
import type { CtdpUiSettings } from "@/lib/ctdp-ui-settings";

export function buildCtdpCanvasGraph(nodes: CtdpNodeRow[], settings: CtdpUiSettings) {
  const flowNodes: CanvasNode[] = [];
  const edges: Edge[] = [];
  const radii = new Map<string, number>();
  const links: { source: string; target: string }[] = [];
  const radius = settings.nodeSize / 2;

  nodes.forEach((node) => {
    const id = `ctdp-${node.id}`;
    const armed = Boolean(node.pendingAppointmentId && !node.awaitingJudgment);
    radii.set(id, radius);

    flowNodes.push({
      id,
      type: "ctdpNode",
      position: { x: node.layoutX ?? 0, y: node.layoutY ?? 0 },
      data: {
        kind: "ctdpNode",
        label: node.title,
        entityId: node.id,
        meta: {
          state: node.state,
          refCount: node.refCount,
          armed,
          awaitingJudgment: node.awaitingJudgment,
        },
        highlighted: node.state === "executing" || node.awaitingJudgment || armed,
      },
    });

    if (!node.refTargetId) return;

    const targetId = `ctdp-${node.refTargetId}`;
    links.push({ source: id, target: targetId });
    edges.push({
      id: `ref-${node.id}-${node.refTargetId}`,
      source: id,
      target: targetId,
      type: "refTarget",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: settings.edgeColor,
      },
    });
  });

  const layoutMeta: CtdpForceLayoutMeta = {
    radii,
    links,
    forceOptions: { chargeStrength: settings.forceStrength },
  };

  return { flowNodes, edges, layoutMeta };
}
