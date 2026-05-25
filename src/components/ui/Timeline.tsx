import { cn } from "@/lib/cn";

export function Timeline({ className, children }: { className?: string; children: React.ReactNode }) {
  return <ul className={cn("space-y-0 border-l border-rule/80 ml-2", className)}>{children}</ul>;
}

export function TimelineItem({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("relative pl-7 pb-7 last:pb-0", className)}>
      <span className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent border border-panel" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {meta && <p className="text-xs text-ink-muted font-data mt-0.5">{meta}</p>}
      {children && <div className="mt-2.5 text-sm text-ink-muted leading-relaxed">{children}</div>}
    </li>
  );
}
