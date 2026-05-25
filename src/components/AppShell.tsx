"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GitBranch,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  ScrollText,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/dashboard", label: "总览", icon: LayoutDashboard },
  { href: "/ctdp", label: "CTDP", icon: GitBranch },
  { href: "/rsip", label: "RSIP", icon: ListTree },
  { href: "/review", label: "复盘", icon: ScrollText },
  { href: "/guide", label: "入门指南", icon: BookOpen },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul>
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <li key={href}>
            <Link
              href={href}
              prefetch
              onClick={onNavigate}
              className={cn("app-nav-link", active && "is-active")}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div className="min-h-dvh bg-surface">
      <div className="app-shell-width flex min-h-dvh gap-0 md:gap-8 px-3 py-3 md:px-4 md:py-5">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <Link href="/dashboard" prefetch className="no-underline hover:no-underline block pb-6 hairline-b">
            <p className="text-kicker">SRS</p>
            <p className="mt-2 font-display text-xl normal-case tracking-tight text-ink">自控力协议</p>
          </Link>
          <nav className="py-4">
            <NavLinks />
          </nav>
          <div className="space-y-4 hairline-t pt-4">
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4" aria-hidden />
                退出
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="app-shell-mobile-header flex items-center justify-between gap-3 hairline-b pb-3 lg:hidden">
            <Link href="/dashboard" prefetch className="no-underline hover:no-underline min-w-0">
              <p className="text-kicker">SRS</p>
              <p className="font-display text-lg normal-case leading-none truncate">自控力协议</p>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle className="hidden w-[140px] sm:flex min-h-11" />
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center border border-rule bg-panel"
                onClick={() => setOpen(!open)}
                aria-label={open ? "关闭菜单" : "打开菜单"}
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {open && (
            <nav className="py-4 lg:hidden hairline-b" aria-label="移动导航">
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-4 space-y-3">
                <ThemeToggle className="w-full sm:hidden min-h-11" />
                <form action="/api/auth/logout" method="post">
                  <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 min-h-11">
                    <LogOut className="h-4 w-4" aria-hidden />
                    退出
                  </Button>
                </form>
              </div>
            </nav>
          )}

          <main className="flex-1 page-enter py-4 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
