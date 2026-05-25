"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const APP_PREFIXES = ["/dashboard", "/ctdp", "/rsip", "/review"];

export function ThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    document.documentElement.dataset.theme = isApp ? "app" : "marketing";
  }, [pathname]);

  return <>{children}</>;
}
