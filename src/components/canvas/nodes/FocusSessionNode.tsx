"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import { Badge } from "@/components/ui/Badge";
import type { CanvasNodeData } from "@/components/canvas/types";

export function FocusSessionNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const mode = (d.meta?.mode as string) ?? "standard";
  return (
    <BaseNodeShell
      className="border-accent/50 seal-stripe"
      highlighted={d.highlighted}
      source={false}
    >
      <div className="flex items-center gap-2">
        <Badge variant={mode === "scout" ? "scout" : "accent"}>{mode}</Badge>
        <span className="text-xs font-medium">专注中</span>
      </div>
      <p className="text-xs text-ink-muted mt-1">{d.label}</p>
    </BaseNodeShell>
  );
}
