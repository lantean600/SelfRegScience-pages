import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

export function PublicMasthead({ className }: { className?: string }) {
  return (
    <header className={cn("masthead-minimal", className)}>
      <Link href="/" prefetch className="no-underline hover:no-underline min-w-0">
        <span className="text-kicker">SRS</span>
        <span className="ml-3 font-display text-sm normal-case tracking-tight text-ink truncate">
          自控力协议
        </span>
      </Link>
      <nav className="masthead-grid-nav text-caption" aria-label="公共导航">
        <Link href="/guide" prefetch className="no-underline hover:underline">
          导览
        </Link>
        <Link href="/login" prefetch className="no-underline hover:underline">
          登录
        </Link>
      </nav>
      <ThemeToggle className="masthead-theme w-full border-0 rounded-none min-h-0 h-full" />
    </header>
  );
}
