"use client";

import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { useCtdpSettings } from "@/components/ctdp/CtdpSettingsContext";

function straightPathBetweenNodes(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  radius: number,
  markerPad = 8,
) {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy);
  if (len < 1) return `M ${sx} ${sy} L ${tx} ${ty}`;
  const ux = dx / len;
  const uy = dy / len;
  const x1 = sx + ux * radius;
  const y1 = sy + uy * radius;
  const x2 = tx - ux * (radius + markerPad);
  const y2 = ty - uy * (radius + markerPad);
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function RefTargetEdge(props: EdgeProps) {
  const { settings } = useCtdpSettings();
  const radius = settings.nodeSize / 2;
  const path = straightPathBetweenNodes(
    props.sourceX,
    props.sourceY,
    props.targetX,
    props.targetY,
    radius,
  );

  return (
    <BaseEdge
      id={props.id}
      path={path}
      markerEnd={props.markerEnd}
      className="!stroke-[var(--ctdp-edge-color)]"
      style={{ strokeWidth: 1.5 }}
    />
  );
}
