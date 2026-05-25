"use client";

import { useCallback, useMemo, useState } from "react";
import type { Connection } from "@xyflow/react";
import { ProtocolCanvas } from "@/components/canvas/ProtocolCanvas";
import { NodeInspector } from "@/components/canvas/NodeInspector";
import { CanvasContextMenu } from "@/components/canvas/CanvasContextMenu";
import { TheoryTip } from "@/components/canvas/TheoryTip";
import { useNodeMutation } from "@/components/canvas/useNodeMutation";
import { buildRsipCanvasGraph } from "@/components/rsip/rsip-canvas-graph";
import { todayInTimezone } from "@/lib/date-utils";
import type { CanvasNode, InspectorTarget } from "@/components/canvas/types";
import { useRsipData, type RsipTreeNode } from "@/components/rsip/RsipDataContext";

export function RsipCanvas() {
  const { policies, treeNodes, mutate, upsertTreeNode, removeTreeNode, refetchRsip } =
    useRsipData();
  const { patchLayout } = useNodeMutation();
  const today = todayInTimezone("Asia/Shanghai");
  const [inspector, setInspector] = useState<InspectorTarget>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    policyId: string;
  } | null>(null);

  const { nodes, edges, orphans } = useMemo(
    () => buildRsipCanvasGraph({ treeNodes, policies, today }),
    [treeNodes, policies, today],
  );

  const onLayoutCommit = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (nodeId.startsWith("pnode-")) {
        patchLayout("policyNode", nodeId.replace("pnode-", ""), x, y).catch(() => {});
      }
    },
    [patchLayout],
  );

  const applyTreeNode = useCallback(
    (raw: RsipTreeNode & { policy: RsipTreeNode["policy"] }) => {
      upsertTreeNode({
        id: raw.id,
        status: raw.status,
        parentId: raw.parentId ?? null,
        addedOnDate: raw.addedOnDate,
        layoutX: raw.layoutX,
        layoutY: raw.layoutY,
        policy: raw.policy,
      });
    },
    [upsertTreeNode],
  );

  const daily = useCallback(
    async (nodeId: string, satisfied: boolean) => {
      await mutate({
        url: "/api/policy-tree",
        init: {
          method: "POST",
          body: { action: "daily", nodeId, satisfied },
        },
        revalidate: refetchRsip,
      });
    },
    [mutate, refetchRsip],
  );

  const mountOrphan = useCallback(
    async (policyId: string, parentNodeId: string | null) => {
      await mutate<RsipTreeNode & { policy: RsipTreeNode["policy"] }>({
        url: "/api/policy-tree",
        init: {
          method: "POST",
          body: {
            action: "add",
            policyId,
            parentId: parentNodeId ?? undefined,
          },
        },
        onSuccess: applyTreeNode,
        revalidate: refetchRsip,
      });
    },
    [applyTreeNode, mutate, refetchRsip],
  );

  const moveNode = useCallback(
    async (nodeId: string, parentId: string | null) => {
      await mutate<RsipTreeNode & { policy: RsipTreeNode["policy"] }>({
        url: `/api/policy-tree/nodes/${nodeId}`,
        init: {
          method: "PATCH",
          body: { parentId: parentId ?? "" },
        },
        onSuccess: applyTreeNode,
        revalidate: refetchRsip,
      });
    },
    [applyTreeNode, mutate, refetchRsip],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const src = params.source ?? "";
      const tgt = params.target ?? "";
      if (src.startsWith("orphan-") && tgt.startsWith("pnode-")) {
        void mountOrphan(src.replace("orphan-", ""), tgt.replace("pnode-", ""));
        return;
      }
      if (src.startsWith("pnode-") && tgt.startsWith("pnode-")) {
        void moveNode(src.replace("pnode-", ""), tgt.replace("pnode-", ""));
      }
    },
    [mountOrphan, moveNode],
  );

  const onNodeDoubleClick: import("@xyflow/react").NodeMouseHandler = useCallback(
    (_, node) => {
      const k = (node.data as CanvasNode["data"]).kind;
      if (k === "policy" || k === "policyOrphan") {
        const data = node.data as CanvasNode["data"];
        setInspector({
          kind: k,
          entityId: data.entityId,
          data,
        });
      }
    },
    [],
  );

  const onNodeContextMenu: import("@xyflow/react").NodeMouseHandler = useCallback(
    (e, node) => {
      const data = node.data as CanvasNode["data"];
      if (data.kind !== "policy" && data.kind !== "policyRoot") return;
      e.preventDefault();
      setMenu({
        x: e.clientX,
        y: e.clientY,
        nodeId: data.entityId,
        policyId: (data.meta?.policyId as string) ?? "",
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="section-marker">Policy Tree Canvas</span>
        <TheoryTip term="policy_tree" />
        <TheoryTip term="policy" />
      </div>
      {orphans.length > 0 && (
        <p className="text-xs text-ink-muted">
          左侧虚线框为未挂载国策（{orphans.length}），拖到树节点上即可点亮。
        </p>
      )}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <ProtocolCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onLayoutCommit={onLayoutCommit}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
          />
        </div>
        <NodeInspector
          target={inspector}
          onClose={() => setInspector(null)}
          revalidate={refetchRsip}
        />
      </div>
      {menu && (
        <CanvasContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: "满足", onClick: () => daily(menu.nodeId, true) },
            { label: "未满足", onClick: () => daily(menu.nodeId, false) },
            {
              label: "熄灭子树",
              danger: true,
              onClick: async () => {
                await mutate({
                  url: `/api/policy-tree/nodes/${menu.nodeId}`,
                  init: { method: "DELETE" },
                  onOptimistic: () => removeTreeNode(menu.nodeId),
                  revalidate: refetchRsip,
                });
              },
            },
          ]}
        />
      )}
    </div>
  );
}
