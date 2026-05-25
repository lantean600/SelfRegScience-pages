import { startTransition } from "react";

export type ServerMutationInit = Omit<RequestInit, "body" | "method"> & {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

export class ServerMutationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ServerMutationError";
  }
}

/** 解析 API JSON；失败时抛出可读错误 */
export async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = (text ? JSON.parse(text) : {}) as T & { error?: string };
  if (!res.ok) {
    throw new ServerMutationError(data.error ?? res.statusText ?? "REQUEST_FAILED", res.status);
  }
  return data;
}

/**
 * 标准变更流程：可选乐观更新 → 请求 → onSuccess → 后台 revalidate
 * 不依赖 router.refresh 才能让 UI 动起来。
 */
function scheduleRevalidate(fn?: () => void | Promise<void>) {
  if (!fn) return;
  const run = () => {
    void Promise.resolve(fn()).catch(() => {});
  };
  startTransition(run);
}

export async function runServerMutation<T>(options: {
  url: string;
  init?: ServerMutationInit;
  onOptimistic?: () => void;
  onSuccess?: (data: T) => void;
  onError?: (error: ServerMutationError) => void;
  onRollback?: () => void;
  revalidate?: () => void | Promise<void>;
}): Promise<T> {
  const { url, init, onOptimistic, onSuccess, onError, onRollback, revalidate } = options;
  onOptimistic?.();
  try {
    const { body, ...rest } = init ?? {};
    const res = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...rest.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await parseApiJson<T>(res);
    startTransition(() => onSuccess?.(data));
    scheduleRevalidate(revalidate);
    return data;
  } catch (e) {
    onRollback?.();
    if (e instanceof ServerMutationError) onError?.(e);
    throw e;
  }
}
