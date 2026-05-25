"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useServerMutation } from "@/hooks/use-server-mutation";

export function CronTrigger() {
  const { mutate } = useServerMutation();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      await mutate({
        url: "/api/cron/process",
        init: { method: "POST" },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="rail" size="sm" onClick={run} disabled={loading}>
      {loading ? "检查中…" : "运行定时检查"}
    </Button>
  );
}
