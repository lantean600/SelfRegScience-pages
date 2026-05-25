"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function BaseNodeShell({
  children,
  className,
  highlighted,
  source = true,
  target = true,
}: {
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
  source?: boolean;
  target?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-[152px] max-w-[240px] rounded-sm border border-rule bg-panel px-3 py-2 font-sans text-sm transition-[border-color,box-shadow]",
        highlighted && "ring-2 ring-editorial/35 border-editorial/55",
        className,
      )}
    >
      {target && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-accent !w-2 !h-2 !border-0"
        />
      )}
      {children}
      {source && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-accent !w-2 !h-2 !border-0"
        />
      )}
    </div>
  );
}
