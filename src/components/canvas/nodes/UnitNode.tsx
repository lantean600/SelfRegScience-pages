"use client";

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { CanvasNodeData } from "@/components/canvas/types";

const unitColors: Record<string, string> = {
  assault: "bg-accent",
  recon: "bg-ink-muted",
  command: "bg-signal",
  special: "bg-success",
  engineering: "bg-ink/30",
  logistics: "bg-rule",
};

export function UnitNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  const type = (d.meta?.unitType as string) ?? "assault";
  const completed = d.meta?.completed as boolean;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1",
        d.highlighted && "scale-110 transition-transform",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-accent !w-2 !h-2 !border-0"
      />
      <span
        className={cn(
          "h-4 w-4 rounded-full border border-rule",
          unitColors[type] ?? "bg-rule",
          completed && "opacity-40",
        )}
        title={type}
      />
      <span
        className={cn(
          "font-data text-[9px] uppercase text-ink-muted",
          completed && "line-through",
        )}
      >
        {type}
      </span>
    </div>
  );
}
