import { cn } from "@/lib/cn";

export function LegalBlock({
  prefix = "§",
  children,
  className,
}: {
  prefix?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <blockquote className={cn("legal-block my-4", className)}>
      <span className="text-accent font-data not-italic mr-2">{prefix}</span>
      {children}
    </blockquote>
  );
}
