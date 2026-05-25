import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

export function Tree({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("space-y-1", className)}>{children}</ul>;
}

export function TreeNode({
  depth = 0,
  title,
  status = "active",
  badge,
  isNewToday,
  frozen,
  children,
  actions,
}: {
  depth?: number;
  title: string;
  status?: "active" | "extinguished";
  badge?: string;
  isNewToday?: boolean;
  frozen?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const extinguished = status === "extinguished";

  return (
    <li
      className={cn(
        "relative",
        frozen && "freeze-texture rounded-sm",
        extinguished && "opacity-50",
      )}
      style={{ paddingLeft: depth * 20 }}
    >
      {depth > 0 && (
        <span
          className="absolute top-0 bottom-0 w-px bg-rule"
          style={{ left: depth * 20 - 12 }}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 py-2 pr-2 rounded-sm",
          !extinguished && "hover:bg-surface/80",
        )}
      >
        <span
          className={cn(
            "text-sm text-ink",
            extinguished && "line-through",
          )}
        >
          {title}
        </span>
        {badge && <Badge variant="outline">{badge}</Badge>}
        {isNewToday && (
          <span className="font-data text-[10px] text-accent">+1</span>
        )}
        {actions && <div className="ml-auto flex flex-wrap gap-1">{actions}</div>}
      </div>
      {children}
    </li>
  );
}
