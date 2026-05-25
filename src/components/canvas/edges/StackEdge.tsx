"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export function StackEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        stroke: "var(--color-ink-muted)",
        strokeWidth: 1,
        strokeDasharray: "4 4",
      }}
    />
  );
}
