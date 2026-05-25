"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-9 border border-rule bg-panel", className)} />;
  }

  const isLight = resolvedTheme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={cn(
        "flex w-full items-center justify-center gap-2 min-h-9 border border-rule bg-panel text-caption transition-colors hover:text-ink",
        className,
      )}
      aria-label={isLight ? "切换深色" : "切换浅色"}
    >
      {isLight ? <Moon className="h-3.5 w-3.5" aria-hidden /> : <Sun className="h-3.5 w-3.5" aria-hidden />}
      <span>{isLight ? "深色" : "浅色"}</span>
    </button>
  );
}
