"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { Progress } from "./Progress";

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function subscribeTick(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 1000);
  return () => clearInterval(id);
}

export function Countdown({
  deadline,
  start,
  label = "剩余",
  className,
}: {
  deadline: Date | string;
  start?: Date | string;
  label?: string;
  className?: string;
}) {
  const end = useMemo(() => new Date(deadline).getTime(), [deadline]);
  const begin = useMemo(
    () => (start ? new Date(start).getTime() : end),
    [start, end],
  );
  const total = Math.max(1, end - begin);

  const now = useSyncExternalStore(
    subscribeTick,
    () => Date.now(),
    () => begin,
  );

  const remaining = end - now;
  const overdue = remaining <= 0;
  const elapsed = Math.min(total, Math.max(0, now - begin));
  const pct = Math.round((elapsed / total) * 10000) / 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-baseline font-data text-sm">
        <span className="text-ink-muted uppercase text-[10px] tracking-wider">
          {label}
        </span>
        <span className={cn(overdue ? "text-signal" : "text-ink")}>
          {overdue ? "已逾期" : formatRemaining(remaining)}
        </span>
      </div>
      <Progress value={pct} variant={overdue ? "signal" : "accent"} />
    </div>
  );
}
