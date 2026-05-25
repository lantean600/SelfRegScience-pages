import { cn } from "@/lib/cn";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 md:mb-10 page-enter hairline-b pb-6 md:pb-8", className)}>
      <div className="flex flex-col items-stretch gap-6 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0 max-w-3xl" data-page-hero>
          {kicker && <p className="section-marker mb-4">{kicker}</p>}
          <h1 className="text-headline-zh">{title}</h1>
          {description && (
            <p className="mt-4 max-w-2xl text-editorial-body">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto md:shrink-0 md:pt-1 [&_button]:min-h-11 [&_a]:min-h-11">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
