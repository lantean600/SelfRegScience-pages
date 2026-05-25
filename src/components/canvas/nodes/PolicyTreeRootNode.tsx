"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import type { CanvasNodeData } from "@/components/canvas/types";

export function PolicyTreeRootNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  return (
    <BaseNodeShell
      className="border-2 border-accent/30"
      highlighted={d.highlighted}
      target={false}
    >
      <p className="font-data text-[9px] uppercase tracking-widest text-accent">
        genesis
      </p>
      <p className="font-serif text-sm">{d.label}</p>
    </BaseNodeShell>
  );
}
