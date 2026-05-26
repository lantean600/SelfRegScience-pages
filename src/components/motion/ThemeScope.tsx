"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { APP_ROUTE_PREFIXES } from "@/lib/motion/app-routes";

const APP_PREFIXES = APP_ROUTE_PREFIXES;

export function ThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    document.documentElement.dataset.theme = isApp ? "app" : "marketing";
  }, [pathname]);

  return <>{children}</>;
}
