import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

const variants = {
  default: "border-rule text-ink-muted bg-surface",
  accent: "border-accent/50 text-accent bg-accent/10",
  editorial: "border-editorial/60 text-editorial bg-editorial/8",
  signal: "border-signal/50 text-signal bg-signal/10",
  success: "border-success/50 text-success bg-success/10",
  outline: "border-rule-strong text-ink bg-transparent",
  initial: "border-ink-muted/40 text-ink-muted bg-surface font-data",
  executing: "border-accent text-accent bg-accent/10 font-data",
  success_state: "border-success text-success bg-success/10 font-data",
  failed: "border-signal/60 text-signal bg-signal/10 font-data",
  elite: "border-accent text-accent font-data",
  scout: "border-ink-muted text-ink-muted font-data",
  extinguished: "border-rule text-ink-muted/60 line-through",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
