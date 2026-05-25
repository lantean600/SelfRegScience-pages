"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import { Badge } from "@/components/ui/Badge";
import type { CanvasNodeData } from "@/components/canvas/types";

export function MainChainNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const streak = (d.meta?.streak as number) ?? 0;
  const tier = (d.meta?.tier as string) ?? "normal";
  return (
    <BaseNodeShell highlighted={d.highlighted}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-2xl text-accent">#{streak}</span>
        <Badge variant="outline">{tier}</Badge>
      </div>
      <p className="text-xs text-ink-muted mt-1 truncate">{d.label}</p>
    </BaseNodeShell>
  );
}
