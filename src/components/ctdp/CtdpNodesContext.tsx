"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";
import { mapApiNodeToRow, mapSnapshotNodes } from "@/components/ctdp/ctdp-node-mapper";
import { useServerMutation } from "@/hooks/use-server-mutation";

type CtdpNetworkSnap = {
  network: { completeness: number };
  nodes: Parameters<typeof mapApiNodeToRow>[0][];
};

type CtdpNodesContextValue = {
  nodes: CtdpNodeRow[];
  completeness: number;
  seats: { id: string; name: string }[];
  patchNode: (id: string, patch: Partial<CtdpNodeRow>) => void;
  upsertNode: (row: CtdpNodeRow) => void;
  removeNode: (id: string) => void;
  replaceNodeId: (oldId: string, row: CtdpNodeRow) => void;
  addSeat: (seat: { id: string; name: string }) => void;
  /** 从 /api/ctdp/network 拉取最新森林（不依赖整页刷新） */
  refetchForest: () => Promise<void>;
  mutate: ReturnType<typeof useServerMutation>["mutate"];
};

const CtdpNodesContext = createContext<CtdpNodesContextValue | null>(null);

export function CtdpNodesProvider({
  initialNodes,
  initialCompleteness,
  initialSeats,
  children,
}: {
  initialNodes: CtdpNodeRow[];
  initialCompleteness: number;
  initialSeats: { id: string; name: string }[];
  children: ReactNode;
}) {
  const { mutate, refresh } = useServerMutation();
  const [nodes, setNodes] = useState(initialNodes);
  const [completeness, setCompleteness] = useState(initialCompleteness);
  const [seats, setSeats] = useState(initialSeats);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setCompleteness(initialCompleteness);
  }, [initialCompleteness]);

  useEffect(() => {
    setSeats(initialSeats);
  }, [initialSeats]);

  const patchNode = useCallback((id: string, patch: Partial<CtdpNodeRow>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const upsertNode = useCallback((row: CtdpNodeRow) => {
    setNodes((prev) => {
      const i = prev.findIndex((n) => n.id === row.id);
      if (i < 0) return [...prev, row];
      const next = [...prev];
      const prevRow = next[i];
      next[i] = {
        ...prevRow,
        ...row,
        appointments: row.appointments.length > 0 ? row.appointments : prevRow.appointments,
        activeSession: row.activeSession ?? prevRow.activeSession,
      };
      return next;
    });
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const replaceNodeId = useCallback((oldId: string, row: CtdpNodeRow) => {
    setNodes((prev) => prev.map((n) => (n.id === oldId ? row : n)));
  }, []);

  const addSeat = useCallback((seat: { id: string; name: string }) => {
    setSeats((prev) => (prev.some((s) => s.id === seat.id) ? prev : [...prev, seat]));
  }, []);

  const refetchForest = useCallback(async () => {
    const res = await fetch("/api/ctdp/network", { cache: "no-store" });
    if (!res.ok) return;
    const snap = (await res.json()) as CtdpNetworkSnap;
    setNodes(mapSnapshotNodes(snap.nodes));
    setCompleteness(snap.network.completeness);
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      nodes,
      completeness,
      seats,
      patchNode,
      upsertNode,
      removeNode,
      replaceNodeId,
      addSeat,
      refetchForest,
      mutate,
    }),
    [
      nodes,
      completeness,
      seats,
      patchNode,
      upsertNode,
      removeNode,
      replaceNodeId,
      addSeat,
      refetchForest,
      mutate,
    ],
  );

  return (
    <CtdpNodesContext.Provider value={value}>{children}</CtdpNodesContext.Provider>
  );
}

export function useCtdpNodes() {
  const ctx = useContext(CtdpNodesContext);
  if (!ctx) throw new Error("useCtdpNodes must be used within CtdpNodesProvider");
  return ctx;
}

/** 变更后：用响应体更新本地 + 拉取森林（传播 refCount 等） */
export function useCtdpForestMutation() {
  const { mutate, patchNode, upsertNode, removeNode, replaceNodeId, refetchForest } =
    useCtdpNodes();

  const mutateCtdp = useCallback(
    <T,>(options: {
      url: string;
      init?: Parameters<typeof mutate>[0]["init"];
      optimistic?: () => void;
      rollback?: () => void;
      mapResult?: (data: T) => void;
    }) => {
      const isCreate =
        options.url === "/api/ctdp/nodes" &&
        (options.init?.method === "POST" || options.init?.method === undefined);

      return mutate<T>({
        url: options.url,
        init: options.init,
        onOptimistic: options.optimistic,
        onRollback: options.rollback,
        onSuccess: (data) => {
          if (options.mapResult) options.mapResult(data);
          else if (data && typeof data === "object" && "id" in data && (data as { id?: string }).id) {
            upsertNode(mapApiNodeToRow(data as unknown as Parameters<typeof mapApiNodeToRow>[0]));
          }
        },
        revalidate: isCreate ? undefined : refetchForest,
        skipRouterRefresh: isCreate,
      });
    },
    [mutate, upsertNode, refetchForest],
  );

  return { mutateCtdp, patchNode, upsertNode, removeNode, replaceNodeId, refetchForest };
}
