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
import { useServerMutation } from "@/hooks/use-server-mutation";

export type RsipPolicy = { id: string; title: string; type: string; difficulty?: number };
export type RsipTreeNode = {
  id: string;
  status: string;
  parentId: string | null;
  addedOnDate: string;
  layoutX?: number | null;
  layoutY?: number | null;
  policy: RsipPolicy;
};
export type RsipGroup = {
  id: string;
  name: string;
  faultQuota: number;
  members: { policy: RsipPolicy }[];
};
export type RsipHabit = {
  policy: RsipPolicy;
  internalizationDays: number;
  lifetimeDays: number;
};

type RsipDataContextValue = {
  policies: RsipPolicy[];
  treeNodes: RsipTreeNode[];
  groups: RsipGroup[];
  habits: RsipHabit[];
  upsertTreeNode: (node: RsipTreeNode) => void;
  removeTreeNode: (id: string) => void;
  addPolicy: (policy: RsipPolicy) => void;
  addGroup: (group: RsipGroup) => void;
  refetchRsip: () => Promise<void>;
  mutate: ReturnType<typeof useServerMutation>["mutate"];
};

const RsipDataContext = createContext<RsipDataContextValue | null>(null);

export function RsipDataProvider({
  initialPolicies,
  initialTreeNodes,
  initialGroups,
  initialHabits,
  children,
}: {
  initialPolicies: RsipPolicy[];
  initialTreeNodes: RsipTreeNode[];
  initialGroups: RsipGroup[];
  initialHabits: RsipHabit[];
  children: ReactNode;
}) {
  const { mutate, refresh } = useServerMutation();
  const [policies, setPolicies] = useState(initialPolicies);
  const [treeNodes, setTreeNodes] = useState(initialTreeNodes);
  const [groups, setGroups] = useState(initialGroups);
  const [habits, setHabits] = useState(initialHabits);

  useEffect(() => setPolicies(initialPolicies), [initialPolicies]);
  useEffect(() => setTreeNodes(initialTreeNodes), [initialTreeNodes]);
  useEffect(() => setGroups(initialGroups), [initialGroups]);
  useEffect(() => setHabits(initialHabits), [initialHabits]);

  const upsertTreeNode = useCallback((node: RsipTreeNode) => {
    setTreeNodes((prev) => {
      const i = prev.findIndex((n) => n.id === node.id);
      if (i < 0) return [...prev, node];
      const next = [...prev];
      next[i] = node;
      return next;
    });
  }, []);

  const removeTreeNode = useCallback((id: string) => {
    setTreeNodes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addPolicy = useCallback((policy: RsipPolicy) => {
    setPolicies((prev) => (prev.some((p) => p.id === policy.id) ? prev : [...prev, policy]));
  }, []);

  const addGroup = useCallback((group: RsipGroup) => {
    setGroups((prev) => [group, ...prev]);
  }, []);

  const refetchRsip = useCallback(async () => {
    const res = await fetch("/api/policy-tree", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      tree: { nodes: (RsipTreeNode & { policy: RsipPolicy })[] } | null;
    };
    if (data.tree?.nodes) {
      setTreeNodes(
        data.tree.nodes.map((n) => ({
          ...n,
          policy: n.policy,
        })),
      );
    }
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      policies,
      treeNodes,
      groups,
      habits,
      upsertTreeNode,
      removeTreeNode,
      addPolicy,
      addGroup,
      refetchRsip,
      mutate,
    }),
    [
      policies,
      treeNodes,
      groups,
      habits,
      upsertTreeNode,
      removeTreeNode,
      addPolicy,
      addGroup,
      refetchRsip,
      mutate,
    ],
  );

  return <RsipDataContext.Provider value={value}>{children}</RsipDataContext.Provider>;
}

export function useRsipData() {
  const ctx = useContext(RsipDataContext);
  if (!ctx) throw new Error("useRsipData must be used within RsipDataProvider");
  return ctx;
}
