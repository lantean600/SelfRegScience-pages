"use client";

import { useCallback } from "react";
import { useServerMutation } from "@/hooks/use-server-mutation";

/** @deprecated 布局静默保存等场景；交互变更请用各模块 Context + useServerMutation */
export function useNodeMutation() {
  const { mutate, refresh } = useServerMutation();

  const patch = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      return mutate<unknown>({
        url,
        init: { method: "PATCH", body },
      });
    },
    [mutate],
  );

  const del = useCallback(
    async (url: string) => {
      return mutate<unknown>({
        url,
        init: { method: "DELETE" },
      });
    },
    [mutate],
  );

  const patchLayout = useCallback(
    (resource: "seat" | "policyNode" | "ctdpNode", id: string, x: number, y: number) => {
      const url =
        resource === "seat"
          ? `/api/sacred-seats/${id}`
          : resource === "policyNode"
            ? `/api/policy-tree/nodes/${id}`
            : `/api/ctdp/nodes/${id}`;
      return fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutX: x, layoutY: y }),
      }).catch(() => {});
    },
    [],
  );

  return { patch, del, patchLayout, refresh };
}
