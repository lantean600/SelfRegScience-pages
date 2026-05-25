"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  useOnViewportChange,
  type Node,
  type Edge,
  type OnConnect,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { MouseEvent as ReactMouseEvent } from "react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useTheme } from "next-themes";
import { canvasNodeTypes } from "@/components/canvas/nodeTypes";
import { canvasEdgeTypes } from "@/components/canvas/edgeTypes";
import type { CtdpForceLayoutMeta } from "@/components/canvas/CtdpForceController";
import {
  CtdpForceController,
  emitForceDrag,
} from "@/components/canvas/CtdpForceController";
import { CtdpZoomProvider, useCtdpZoom } from "@/components/ctdp/CtdpZoomContext";
import { ctdpCreateAnchor, setCtdpCreateAnchor } from "@/components/ctdp/ctdp-create-anchor";
import type { CanvasNode } from "@/components/canvas/types";

type CtdpFlowCanvasProps = {
  initialNodes: CanvasNode[];
  initialEdges: Edge[];
  structureKey: string;
  settingsKey: string;
  layoutMeta: CtdpForceLayoutMeta;
  onLayoutCommit?: (nodeId: string, x: number, y: number) => void;
  onConnect?: OnConnect;
  onNodeContextMenu?: NodeMouseHandler;
  onPaneContextMenu?: (event: ReactMouseEvent | MouseEvent) => void;
  labelZoomThreshold?: number;
  children?: React.ReactNode;
};

function ViewportZoomSync() {
  const { setZoom } = useCtdpZoom();
  useOnViewportChange({ onChange: (vp) => setZoom(vp.zoom) });
  return null;
}

function CanvasInner({
  initialNodes,
  initialEdges,
  structureKey,
  settingsKey,
  layoutMeta,
  onLayoutCommit,
  onConnect,
  onNodeContextMenu,
  onPaneContextMenu,
  children,
}: CtdpFlowCanvasProps) {
  const { resolvedTheme } = useTheme();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 刷新时保留力导向位置；新建节点用锚点坐标，避免先闪到 0,0
  useEffect(() => {
    setNodes((prev) => {
      if (prev.length === 0) return initialNodes;
      const posMap = new Map(prev.map((n) => [n.id, n.position]));
      const prevIds = new Set(prev.map((n) => n.id));
      const pendingFlow = prev.find((n) => n.id.includes("pending:"));
      return initialNodes.map((n) => {
        const kept = posMap.get(n.id);
        if (kept) return { ...n, position: kept };
        const isNew = !prevIds.has(n.id);
        if (isNew && pendingFlow) {
          return { ...n, position: pendingFlow.position };
        }
        const atOrigin =
          Math.abs(n.position.x) < 1 && Math.abs(n.position.y) < 1;
        if (isNew && atOrigin) {
          return {
            ...n,
            position: { x: ctdpCreateAnchor.x, y: ctdpCreateAnchor.y },
          };
        }
        return { ...n, position: n.position };
      });
    });
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onPaneContextMenuWrapped = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
      const flowPos = screenToFlowPosition({
        x: "clientX" in event ? event.clientX : 0,
        y: "clientY" in event ? event.clientY : 0,
      });
      const radius = 22;
      setCtdpCreateAnchor(flowPos.x - radius, flowPos.y - radius);
      onPaneContextMenu?.(event);
    },
    [onPaneContextMenu, screenToFlowPosition],
  );

  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    emitForceDrag("start", node);
  }, []);

  const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    emitForceDrag("move", node);
  }, []);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      emitForceDrag("stop", node);
      onLayoutCommit?.(node.id, node.position.x, node.position.y);
    },
    [onLayoutCommit],
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  const hasFitRef = useRef(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const count = nodes.length;
    const shouldFit =
      count > 0 && (!hasFitRef.current || (prevCountRef.current === 0 && count > 0));
    prevCountRef.current = count;
    if (!shouldFit) return;
    hasFitRef.current = true;
    const t = window.setTimeout(() => {
      fitView({ padding: 0.3, maxZoom: 1.1, duration: 200 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [nodes.length, fitView]);

  return (
    <div className="ctdp-flow-wrap ctdp-flow-wrap--mobile relative w-full h-[min(700px,82vh)] overflow-hidden">
      {children}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenuWrapped}
        panOnScroll={false}
        zoomOnPinch
        minZoom={0.2}
        maxZoom={3}
        proOptions={proOptions}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        className="ctdp-constellation"
        defaultEdgeOptions={{ type: "refTarget" }}
        nodesFocusable={false}
      >
        <ViewportZoomSync />
        <CtdpForceController
          structureKey={structureKey}
          settingsKey={settingsKey}
          layoutMeta={layoutMeta}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5}
          color="var(--ctdp-dot)"
        />
        <Controls
          className="!bg-panel/80 !border-rule !shadow-sm ctdp-controls"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

export function CtdpFlowCanvas(props: CtdpFlowCanvasProps) {
  const { labelZoomThreshold = 0.75, ...rest } = props;
  return (
    <ReactFlowProvider>
      <CtdpZoomProvider labelZoomThreshold={labelZoomThreshold}>
        <CanvasInner {...rest} />
      </CtdpZoomProvider>
    </ReactFlowProvider>
  );
}
