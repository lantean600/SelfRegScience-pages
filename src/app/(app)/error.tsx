"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12 page-enter">
      <p className="section-marker">Application Error</p>
      <h1 className="text-headline-zh text-2xl">页面加载失败</h1>
      <p className="text-sm text-ink-muted leading-relaxed">
        {error.message || "发生未知客户端异常。"}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-ink-faint break-all">digest: {error.digest}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button href="/dashboard" variant="secondary">
          返回总览
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset()}>
          重试
        </Button>
      </div>
    </div>
  );
}
