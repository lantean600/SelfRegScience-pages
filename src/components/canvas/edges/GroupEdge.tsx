"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export function GroupEdge({
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
        stroke: "var(--color-rule)",
        strokeWidth: 1.5,
      }}
    />
  );
}
