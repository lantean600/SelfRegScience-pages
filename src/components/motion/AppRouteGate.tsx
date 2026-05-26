"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function AppRouteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(true);

  useEffect(() => {
    setReady(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pathname]);

  if (!ready) {
    return (
      <div
        className="min-h-[40vh] animate-pulse rounded-sm bg-panel/40"
        aria-hidden
      />
    );
  }

  return <>{children}</>;
}
