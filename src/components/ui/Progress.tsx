import { cn } from "@/lib/cn";

export function Progress({
  value,
  max = 100,
  className,
  variant = "accent",
}: {
  value: number;
  max?: number;
  className?: string;
  variant?: "accent" | "signal" | "success";
}) {
  const pct = Math.round(Math.min(100, Math.max(0, (value / max) * 100)) * 100) / 100;
  const bar =
    variant === "signal"
      ? "bg-signal"
      : variant === "success"
        ? "bg-success"
        : "bg-accent";

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-rule/70", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
