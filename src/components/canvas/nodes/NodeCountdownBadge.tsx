"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

function subscribeTick(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 1000);
  return () => clearInterval(id);
}

function formatMinutes(ms: number) {
  if (ms <= 0) return "0 min";
  const min = Math.ceil(ms / 60000);
  return `${min} min`;
}

export function NodeCountdownBadge({
  deadline,
  startedAt,
  durationMinutes,
  staticMinutes,
  className,
}: {
  deadline?: string;
  startedAt?: string;
  durationMinutes?: number;
  staticMinutes?: number;
  className?: string;
}) {
  const end = useMemo(() => {
    if (staticMinutes != null) return null;
    if (deadline) return new Date(deadline).getTime();
    if (startedAt && durationMinutes != null) {
      return new Date(startedAt).getTime() + durationMinutes * 60000;
    }
    return null;
  }, [deadline, startedAt, durationMinutes, staticMinutes]);

  const now = useSyncExternalStore(
    subscribeTick,
    () => Date.now(),
    () => Date.now(),
  );

  const label =
    staticMinutes != null
      ? `${staticMinutes} min`
      : end != null
        ? formatMinutes(end - now)
        : null;

  if (!label) return null;

  const overdue = end != null && end - now <= 0 && staticMinutes == null;

  return (
    <span
      className={cn(
        "ctdp-node-countdown",
        overdue && "is-overdue",
        className,
      )}
      aria-live="polite"
    >
      {overdue ? "逾期" : label}
    </span>
  );
}
