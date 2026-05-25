import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

export function applyDagreLayout<T extends Node>(
  nodes: T[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
  size?: { width: number; height: number },
): T[] {
  const w = size?.width ?? NODE_WIDTH;
  const h = size?.height ?? NODE_HEIGHT;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: size ? 40 : 48, ranksep: size ? 56 : 64 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });
}

export function mergeSavedPositions<T extends Node>(
  nodes: T[],
  saved: Map<string, { x: number; y: number }>,
): T[] {
  return nodes.map((n) => {
    const p = saved.get(n.id);
    if (p) return { ...n, position: p };
    return n;
  });
}
