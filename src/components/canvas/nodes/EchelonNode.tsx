"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import type { CanvasNodeData } from "@/components/canvas/types";

export function EchelonNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const level = (d.meta?.level as number) ?? 3;
  const hashes = "#".repeat(Math.min(5, Math.max(1, level)));
  return (
    <BaseNodeShell highlighted={d.highlighted} target={false}>
      <span className="font-data text-lg text-accent">{hashes}</span>
      <p className="font-serif text-sm mt-0.5">{d.label}</p>
    </BaseNodeShell>
  );
}
