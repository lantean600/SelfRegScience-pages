import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

const variants = {
  info: "border-rule bg-panel/90 text-ink",
  warning: "border-signal/40 bg-signal/6 text-ink",
  danger: "border-signal bg-signal/12 text-ink",
  success: "border-success/40 bg-success/8 text-ink",
};

export function Alert({
  variant = "info",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-sm border px-4 py-3.5 text-sm shadow-[var(--shadow-panel)]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
