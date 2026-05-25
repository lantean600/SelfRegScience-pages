import { PublicMasthead } from "@/components/layout/PublicMasthead";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicMasthead />
      <div className="marketing-shell flex-1 py-[var(--spacing-section)]">
        <div className="mx-auto max-w-lg">
          <p className="section-marker mb-6">Protocol Access</p>
          <h1 className="text-headline-zh">{title}</h1>
          {subtitle && (
            <p className="mt-4 text-editorial-body">{subtitle}</p>
          )}
          <div className="mt-10 hairline-t pt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
