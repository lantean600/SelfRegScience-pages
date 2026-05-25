"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import { Badge } from "@/components/ui/Badge";
import type { CanvasNodeData } from "@/components/canvas/types";

export function GroupNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const seq = d.meta?.sequenceAppointment as boolean;
  return (
    <BaseNodeShell highlighted={d.highlighted}>
      <p className="text-sm font-medium">{d.label}</p>
      {seq && (
        <Badge variant="accent" className="mt-1 text-[9px]">
          串行预约
        </Badge>
      )}
    </BaseNodeShell>
  );
}
