"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import { Badge } from "@/components/ui/Badge";
import type { CanvasNodeData } from "@/components/canvas/types";

export function AppointmentNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const kind = (d.meta?.kind as string) ?? "primary";
  const overdue = Boolean(d.meta?.overdue);
  return (
    <BaseNodeShell
      className={overdue ? "border-signal bg-signal/5" : "border-signal/40"}
      highlighted={d.highlighted || overdue}
    >
      <div className="flex gap-1 flex-wrap">
        <Badge variant="scout">{kind}</Badge>
        {overdue && <Badge variant="signal">逾期</Badge>}
      </div>
      <p className="text-xs text-ink mt-1 truncate">{d.label}</p>
      {d.sublabel && (
        <p className="font-data text-[10px] text-ink-muted mt-0.5">{d.sublabel}</p>
      )}
    </BaseNodeShell>
  );
}
