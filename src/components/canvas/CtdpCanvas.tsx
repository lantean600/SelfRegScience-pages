"use client";

import { useCallback, useMemo, useState } from "react";
import type { Connection, NodeMouseHandler } from "@xyflow/react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FigureFrame } from "@/components/ui/Card";
import { CtdpFlowCanvas } from "@/components/canvas/CtdpFlowCanvas";
import { getCtdpActionState } from "@/components/ctdp/ctdp-action-state";
import { buildCtdpCanvasGraph } from "@/components/ctdp/ctdp-canvas-graph";
import { CtdpCanvasTheme } from "@/components/ctdp/CtdpCanvasTheme";
import { useCtdpSettings } from "@/components/ctdp/CtdpSettingsContext";
import { useCtdpForestMutation, useCtdpNodes } from "@/components/ctdp/CtdpNodesContext";
import { mapApiNodeToRow } from "@/components/ctdp/ctdp-node-mapper";
import { CtdpFloatingMenu, type MenuItem } from "@/components/ctdp/CtdpFloatingMenu";
import { CtdpNodeDialog } from "@/components/ctdp/CtdpNodeDialog";
import { CtdpGlobalSettingsModal } from "@/components/ctdp/CtdpGlobalSettingsModal";
import { setCtdpCreateAnchor } from "@/components/ctdp/ctdp-create-anchor";
import type { CanvasNodeData } from "@/components/canvas/types";

export type CtdpNodeRow = {
  id: string;
  title: string;
  state: string;
  refTargetId: string | null;
  refCount: number;
  judgmentRule: string | null;
  layoutX: number | null;
  layoutY: number | null;
  pendingAppointmentId: string | null;
  activeSessionId: string | null;
  awaitingJudgment: boolean;
  judgmentReason: string | null;
  appointments: { id: string; deadlineAt: string; status: string }[];
};

type MenuState =
  | { kind: "node"; x: number; y: number; nodeId: string }
  | { kind: "pane"; x: number; y: number }
  | null;

export function CtdpCanvas() {
  const { nodes, seats } = useCtdpNodes();
  const { mutateCtdp, patchNode, removeNode, upsertNode } = useCtdpForestMutation();
  const { settings } = useCtdpSettings();

  const [menu, setMenu] = useState<MenuState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editNodeId, setEditNodeId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const editNode = editNodeId ? nodeMap.get(editNodeId) : undefined;

  const structureKey = useMemo(
    () => nodes.map((n) => `${n.id}:${n.refTargetId ?? ""}`).join("|"),
    [nodes],
  );

  const settingsKey = useMemo(
    () => `f${settings.forceStrength}|s${settings.nodeSize}`,
    [settings.forceStrength, settings.nodeSize],
  );

  const { flowNodes, edges, layoutMeta } = useMemo(
    () => buildCtdpCanvasGraph(nodes, settings),
    [nodes, settings],
  );

  const onLayoutCommit = useCallback(async (nodeId: string, x: number, y: number) => {
    if (!nodeId.startsWith("ctdp-")) return;
    const id = nodeId.replace("ctdp-", "");
    fetch(`/api/ctdp/nodes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layoutX: x, layoutY: y }),
    }).catch(() => {});
  }, []);

  const onConnect = useCallback(
    async (params: Connection) => {
      const src = params.source?.replace("ctdp-", "");
      const tgt = params.target?.replace("ctdp-", "");
      if (!src || !tgt) return;
      const prevRef = nodeMap.get(src)?.refTargetId ?? null;
      await mutateCtdp({
        url: `/api/ctdp/nodes/${src}`,
        init: {
          method: "PATCH",
          body: { refTargetId: tgt },
        },
        optimistic: () => patchNode(src, { refTargetId: tgt }),
        rollback: () => patchNode(src, { refTargetId: prevRef }),
        mapResult: (data) => {
          if (data && typeof data === "object" && "id" in data) {
            upsertNode(mapApiNodeToRow(data as Parameters<typeof mapApiNodeToRow>[0]));
          }
        },
      });
    },
    [mutateCtdp, nodeMap, patchNode, upsertNode],
  );

  async function nodeAction(
    nodeId: string,
    path: string,
    optimisticPatch: Partial<CtdpNodeRow>,
    body?: object,
  ) {
    const prev = nodeMap.get(nodeId);
    setLoadingNodeId(nodeId);
    setMenu(null);
    try {
      await mutateCtdp({
        url: `/api/ctdp/nodes/${nodeId}/${path}`,
        init: { method: "POST", body },
        optimistic: () => patchNode(nodeId, optimisticPatch),
        rollback: () => {
          if (prev) upsertNode(prev);
        },
        mapResult: (data) => {
          if (data && typeof data === "object" && "id" in data) {
            upsertNode(mapApiNodeToRow(data as Parameters<typeof mapApiNodeToRow>[0]));
          }
        },
      });
    } finally {
      setLoadingNodeId(null);
    }
  }

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    const data = node.data as CanvasNodeData;
    if (data.kind !== "ctdpNode") return;
    setMenu({ kind: "node", x: event.clientX, y: event.clientY, nodeId: data.entityId });
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setMenu({ kind: "pane", x: event.clientX, y: event.clientY });
  }, []);

  const menuItems: MenuItem[] = useMemo(() => {
    if (!menu) return [];
    if (menu.kind === "pane") {
      return [
        { type: "item", label: "新建节点", onClick: () => setCreateOpen(true) },
        { type: "separator" },
        { type: "item", label: "全局配置…", onClick: () => setSettingsOpen(true) },
      ];
    }
    const n = nodeMap.get(menu.nodeId);
    if (!n) return [];
    const isLoading = loadingNodeId === n.id;
    const actionState = getCtdpActionState(n, isLoading);

    const items: MenuItem[] = [
      {
        type: "item",
        label: isLoading ? "处理中…" : "编辑…",
        onClick: () => setEditNodeId(n.id),
        disabled: !actionState.canEdit,
      },
    ];

    if (actionState.canArm) {
      items.push({
        type: "item",
        label: "执行（预约）",
        onClick: () =>
          nodeAction(n.id, "arm", { pendingAppointmentId: "pending" }),
      });
    }
    if (actionState.canTrigger) {
      items.push({
        type: "item",
        label: "触发神圣座位",
        onClick: () =>
          nodeAction(n.id, "trigger", { state: "executing", pendingAppointmentId: null }, {
            mode: "standard",
          }),
      });
    }
    if (actionState.canAbandon) {
      items.push(
        {
          type: "item",
          label: "完成专注",
          disabled: !actionState.canCompleteFocus,
          onClick: async () => {
            if (!actionState.canCompleteFocus || !n.activeSessionId) return;
            await mutateCtdp({
              url: `/api/focus-sessions/${n.activeSessionId}/complete`,
              init: {
                method: "POST",
                body: JSON.stringify({ action: "complete" }),
              },
              optimistic: () =>
                patchNode(n.id, {
                  awaitingJudgment: true,
                  judgmentReason: "session_complete",
                }),
              mapResult: (data) => {
                if (data && typeof data === "object" && "id" in data) {
                  upsertNode(mapApiNodeToRow(data as Parameters<typeof mapApiNodeToRow>[0]));
                }
              },
            });
            setMenu(null);
          },
        },
        {
          type: "item",
          label: "放弃",
          danger: true,
          onClick: () => nodeAction(n.id, "abandon", { state: "failed", activeSessionId: null }),
        },
      );
    }
    if (actionState.canJudge) {
      items.push({
        type: "item",
        label: "判定…",
        onClick: () => setEditNodeId(n.id),
      });
    }
    items.push(
      { type: "separator" },
      {
        type: "item",
        label: "删除节点",
        danger: true,
        disabled: !actionState.canDelete,
        onClick: async () => {
          if (!confirm("确定删除？")) return;
          const snapshot = n;
          await mutateCtdp({
            url: `/api/ctdp/nodes/${n.id}`,
            init: { method: "DELETE" },
            optimistic: () => removeNode(n.id),
            rollback: () => upsertNode(snapshot),
          });
        },
      },
    );
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, nodeMap, loadingNodeId, mutateCtdp, patchNode, removeNode, upsertNode]);

  const isEmpty = nodes.length === 0;

  return (
    <CtdpCanvasTheme settings={settings} className="relative w-full space-y-3">
      <FigureFrame caption="Fig. 1 — 节点森林" aside="CTDP canvas">
        <CtdpFlowCanvas
          initialNodes={flowNodes}
          initialEdges={edges}
          structureKey={structureKey}
          settingsKey={settingsKey}
          layoutMeta={layoutMeta}
          labelZoomThreshold={settings.labelZoomThreshold}
          onLayoutCommit={onLayoutCommit}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
        >
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <EmptyState
                className="max-w-sm pointer-events-auto"
                quote="森林始于一颗可裁决的节点"
                title="尚无节点"
                description="点击 + 或长按画布新建首个 CtdpNode"
              />
            </div>
          )}

          <div className="absolute left-3 top-3 z-10 pointer-events-none">
            <p className="section-marker bg-panel/80 px-2 py-1">Right Click / Connect / Judge</p>
          </div>

          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <Button
              type="button"
              variant="rail"
              size="sm"
              className="min-h-11 min-w-11 h-11 w-11 p-0 rounded-full"
              onClick={() => setSettingsOpen(true)}
              title="全局配置"
              aria-label="全局配置"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-h-11 min-w-11 h-11 w-11 p-0 rounded-full"
              onClick={() => {
                setCtdpCreateAnchor(420, 300);
                setCreateOpen(true);
              }}
              title="新建节点"
              aria-label="新建节点"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="absolute bottom-12 left-3 z-10 text-caption pointer-events-none bg-panel/70 px-2 py-1 rounded-sm hidden md:block">
            滚轮缩放 · 右键操作
          </p>
          <p className="absolute bottom-12 left-3 z-10 text-caption pointer-events-none bg-panel/70 px-2 py-1 rounded-sm md:hidden">
            双指缩放 · 长按节点 · 点 + 新建
          </p>
        </CtdpFlowCanvas>
      </FigureFrame>

      {menu && (
        <CtdpFloatingMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
      {createOpen && (
        <CtdpNodeDialog mode="create" allNodes={nodes} onClose={() => setCreateOpen(false)} />
      )}
      {editNode && (
        <CtdpNodeDialog
          mode="edit"
          node={editNode}
          allNodes={nodes}
          onClose={() => setEditNodeId(null)}
        />
      )}
      <CtdpGlobalSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </CtdpCanvasTheme>
  );
}
