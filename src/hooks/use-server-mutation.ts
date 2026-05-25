"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  runServerMutation,
  type ServerMutationError,
  type ServerMutationInit,
} from "@/lib/mutations/server-mutation";

export function useServerMutation() {
  const router = useRouter();

  const revalidate = useCallback(() => {
    router.refresh();
  }, [router]);

  const mutate = useCallback(
    <T,>(options: {
      url: string;
      init?: ServerMutationInit;
      onOptimistic?: () => void;
      onSuccess?: (data: T) => void;
      onError?: (error: ServerMutationError) => void;
      onRollback?: () => void;
      /** 额外客户端拉取（如 CTDP refetch）；默认仍会 router.refresh */
      revalidate?: () => void | Promise<void>;
      skipRouterRefresh?: boolean;
    }) => {
      const extra = options.revalidate;
      return runServerMutation<T>({
        url: options.url,
        init: options.init,
        onOptimistic: options.onOptimistic,
        onSuccess: options.onSuccess,
        onError: options.onError,
        onRollback: options.onRollback,
        revalidate: async () => {
          await extra?.();
          if (!options.skipRouterRefresh) revalidate();
        },
      });
    },
    [revalidate],
  );

  return { mutate, refresh: revalidate };
}
