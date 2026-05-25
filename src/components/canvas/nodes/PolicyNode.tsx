"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNodeShell } from "@/components/canvas/nodes/BaseNodeShell";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { CanvasNodeData } from "@/components/canvas/types";

const typeStyle: Record<string, string> = {
  passive: "border-ink-muted/40",
  semi_passive: "border-accent/40",
  active: "border-signal/40",
};

export function PolicyNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const type = (d.meta?.type as string) ?? "passive";
  const status = (d.meta?.status as string) ?? "active";
  const isOrphan = d.kind === "policyOrphan";
  const extinguished = status === "extinguished";

  return (
    <BaseNodeShell
      className={cn(
        "relative",
        typeStyle[type],
        extinguished && "opacity-50 grayscale",
        isOrphan && "border-dashed",
      )}
      highlighted={d.highlighted}
    >
      {extinguished && (
        <span className="absolute -top-2 -right-2 font-serif text-[10px] text-signal border border-signal px-1 rounded-sm bg-panel">
          熄
        </span>
      )}
      <Badge variant="outline" className="text-[9px]">
        {type === "passive" ? "被动" : type === "semi_passive" ? "半被动" : "主动"}
      </Badge>
      <p className="text-sm font-medium mt-1 truncate">{d.label}</p>
      {d.sublabel && <p className="text-[10px] text-ink-muted">{d.sublabel}</p>}
    </BaseNodeShell>
  );
}
