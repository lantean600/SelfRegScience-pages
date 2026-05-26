"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { canvasNodeTypes } from "@/components/canvas/nodeTypes";
import { canvasEdgeTypes } from "@/components/canvas/edgeTypes";
import { CtdpSettingsProvider } from "@/components/ctdp/CtdpSettingsContext";
import { CtdpZoomProvider } from "@/components/ctdp/CtdpZoomContext";

export type GuideStep = {
  title: string;
  caption: string;
  detail: string;
  highlight: string[];
  nodes: Node[];
  edges: Edge[];
};

export function GuideFlow({ steps, step }: { steps: GuideStep[]; step: number }) {
  const current = steps[step];
  const nodes = useMemo(
    () =>
      current.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          highlighted: current.highlight.includes(n.id),
        },
      })),
    [current],
  );

  const usesCtdp = current.nodes.some((n) => n.type === "ctdpNode");

  const flow = (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={current.edges}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
      >
        <Background gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </ReactFlowProvider>
  );

  return (
    <div className="h-[340px] ctdp-flow-wrap">
      {usesCtdp ? (
        <CtdpSettingsProvider>
          <CtdpZoomProvider labelZoomThreshold={0.5}>{flow}</CtdpZoomProvider>
        </CtdpSettingsProvider>
      ) : (
        flow
      )}
    </div>
  );
}
