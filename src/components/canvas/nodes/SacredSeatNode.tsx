"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import type { CanvasNodeData } from "@/components/canvas/types";

export function SacredSeatNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  return (
    <BaseNodeShell className="seal-stripe" highlighted={d.highlighted}>
      <p className="font-data text-[9px] uppercase tracking-wider text-ink-muted truncate">
        {d.sublabel ?? "神圣座位"}
      </p>
      <p className="font-serif text-sm text-ink truncate">{d.label}</p>
    </BaseNodeShell>
  );
}
