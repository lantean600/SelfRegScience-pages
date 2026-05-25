"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnConnect,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { MouseEvent as ReactMouseEvent } from "react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { canvasNodeTypes } from "@/components/canvas/nodeTypes";
import { canvasEdgeTypes } from "@/components/canvas/edgeTypes";
import type { CanvasNode } from "@/components/canvas/types";

type ProtocolCanvasProps = {
  initialNodes: CanvasNode[];
  initialEdges: Edge[];
  onLayoutCommit?: (nodeId: string, x: number, y: number, kind: string) => void;
  onConnect?: OnConnect;
  onNodeDoubleClick?: NodeMouseHandler;
  onNodeContextMenu?: NodeMouseHandler;
  onPaneContextMenu?: (event: ReactMouseEvent | MouseEvent) => void;
  fitView?: boolean;
  children?: React.ReactNode;
};

function CanvasInner({
  initialNodes,
  initialEdges,
  onLayoutCommit,
  onConnect,
  onNodeDoubleClick,
  onNodeContextMenu,
  onPaneContextMenu,
  fitView = true,
  children,
}: ProtocolCanvasProps) {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const d = node.data as { kind?: string };
      onLayoutCommit?.(node.id, node.position.x, node.position.y, d.kind ?? "");
    },
    [onLayoutCommit],
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="ctdp-flow-wrap ctdp-flow-wrap--mobile relative w-full h-[min(620px,74vh)] overflow-hidden rounded-sm border border-rule bg-figure-bg shadow-[var(--shadow-stage)]">
      {children}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        onConnect={onConnect}
        onNodeDragStop={onDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        panOnScroll={false}
        zoomOnPinch
        fitView={fitView}
        proOptions={proOptions}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        className="protocol-canvas"
      >
        <Background gap={18} size={1} color="color-mix(in srgb, var(--color-rule-strong) 16%, transparent)" />
        <Controls className="!bg-panel/90 !border-rule !shadow-sm" />
        <MiniMap
          className="!bg-panel !border-rule"
          maskColor="color-mix(in srgb, var(--color-surface) 80%, transparent)"
        />
      </ReactFlow>
    </div>
  );
}

export function ProtocolCanvas(props: ProtocolCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
