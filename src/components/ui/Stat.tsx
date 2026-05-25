import { cn } from "@/lib/cn";

export function Stat({
  label,
  value,
  sub,
  className,
  display = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
  display?: boolean;
}) {
  return (
    <div className={cn("border border-rule bg-panel/70 px-4 py-4", className)}>
      <p className="text-kicker mb-2">{label}</p>
      <p
        className={cn(
          "text-ink leading-none tracking-tight",
          display ? "text-display" : "font-serif text-4xl md:text-5xl",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-3 text-caption">{sub}</p>}
    </div>
  );
}
