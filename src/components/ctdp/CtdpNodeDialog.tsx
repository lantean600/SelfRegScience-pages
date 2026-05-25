"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Countdown } from "@/components/ui/Countdown";
import { CtdpJudgePanel } from "@/components/CtdpJudgePanel";
import { isAppointmentOverdue } from "@/lib/date-utils";
import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";
import { mapApiNodeToRow } from "@/components/ctdp/ctdp-node-mapper";
import { useCtdpForestMutation } from "@/components/ctdp/CtdpNodesContext";
import {
  CTDP_PENDING_PREFIX,
  ctdpCreateAnchor,
} from "@/components/ctdp/ctdp-create-anchor";
import { ServerMutationError } from "@/lib/mutations/server-mutation";

export function CtdpNodeDialog({
  mode,
  node,
  allNodes,
  onClose,
}: {
  mode: "create" | "edit";
  node?: CtdpNodeRow;
  allNodes: CtdpNodeRow[];
  onClose: () => void;
}) {
  const { mutateCtdp, removeNode, patchNode, upsertNode, replaceNodeId } =
    useCtdpForestMutation();

  function emptyRow(id: string, titleText: string, ref: string | null): CtdpNodeRow {
    return {
      id,
      title: titleText,
      state: "initial",
      refTargetId: ref,
      refCount: 0,
      judgmentRule: null,
      layoutX: ctdpCreateAnchor.x,
      layoutY: ctdpCreateAnchor.y,
      pendingAppointmentId: null,
      activeSessionId: null,
      awaitingJudgment: false,
      judgmentReason: null,
      appointments: [],
    };
  }
  const [title, setTitle] = useState(node?.title ?? "");
  const [refTargetId, setRefTargetId] = useState(node?.refTargetId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(node?.title ?? "");
    setRefTargetId(node?.refTargetId ?? "");
    setError("");
  }, [node]);

  const apptDeadline = node?.appointments[0]?.deadlineAt ?? null;
  const showArm =
    mode === "edit" &&
    node?.state === "initial" &&
    !node.pendingAppointmentId &&
    !node.awaitingJudgment;
  const showTrigger =
    mode === "edit" &&
    node?.state === "initial" &&
    node.pendingAppointmentId &&
    apptDeadline &&
    !isAppointmentOverdue(apptDeadline) &&
    !node.awaitingJudgment;

  function applyApiNode(data: unknown) {
    if (data && typeof data === "object" && "id" in data) {
      upsertNode(mapApiNodeToRow(data as Parameters<typeof mapApiNodeToRow>[0]));
    }
  }

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        const tempId = `${CTDP_PENDING_PREFIX}${crypto.randomUUID()}`;
        const layoutX = ctdpCreateAnchor.x;
        const layoutY = ctdpCreateAnchor.y;
        await mutateCtdp({
          url: "/api/ctdp/nodes",
          init: {
            method: "POST",
            body: {
              title: title.trim(),
              refTargetId: refTargetId || null,
              layoutX,
              layoutY,
            },
          },
          optimistic: () =>
            upsertNode(
              emptyRow(tempId, title.trim(), refTargetId || null),
            ),
          rollback: () => removeNode(tempId),
          mapResult: (data) => {
            replaceNodeId(tempId, mapApiNodeToRow(data as Parameters<typeof mapApiNodeToRow>[0]));
          },
        });
      } else if (node) {
        const prev = { title: node.title, refTargetId: node.refTargetId };
        await mutateCtdp({
          url: `/api/ctdp/nodes/${node.id}`,
          init: {
            method: "PATCH",
            body: {
              title: title.trim(),
              refTargetId: refTargetId || null,
            },
          },
          optimistic: () =>
            patchNode(node.id, {
              title: title.trim(),
              refTargetId: refTargetId || null,
            }),
          rollback: () => patchNode(node.id, prev),
          mapResult: applyApiNode,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ServerMutationError ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function action(path: string, body?: object) {
    if (!node) return;
    await mutateCtdp({
      url: `/api/ctdp/nodes/${node.id}/${path}`,
      init: { method: "POST", body },
      mapResult: applyApiNode,
    });
  }

  const refOptions = allNodes.filter((n) => n.id !== node?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30"
      role="dialog"
      aria-modal
    >
      <div className="w-full max-w-[calc(100%-2rem)] sm:max-w-sm max-h-[85dvh] overflow-y-auto rounded-sm border border-rule bg-panel shadow-xl p-5 space-y-4 mx-auto">
        <div className="flex justify-between items-start">
          <h2 className="font-serif text-lg">
            {mode === "create" ? "新建初始节点" : "节点设置"}
          </h2>
          <button type="button" onClick={onClose} className="text-ink-muted text-sm">
            ✕
          </button>
        </div>

        {error && <p className="text-sm text-signal">{error}</p>}

        <Field label="标题">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label="引用节点（可选）" hint="箭头指向被引用者，至多一条出边">
          <select
            className="w-full border border-rule rounded-sm px-3 py-2 text-sm bg-panel"
            value={refTargetId}
            onChange={(e) => setRefTargetId(e.target.value)}
          >
            <option value="">不引用</option>
            {refOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </Field>

        {mode === "edit" && node && (
          <div className="text-xs text-ink-muted space-y-1 border-t border-rule pt-3">
            <p>状态：{node.state}</p>
            <p>引用属性：{node.refCount}</p>
            {node.judgmentRule && (
              <p className="whitespace-pre-wrap">规则：{node.judgmentRule}</p>
            )}
          </div>
        )}

        {mode === "edit" && node && (
          <div className="space-y-2 border-t border-rule pt-3">
            {showArm && (
              <Button size="sm" className="w-full" onClick={() => action("arm")}>
                执行（预约信号）
              </Button>
            )}
            {showTrigger && apptDeadline && (
              <>
                <Countdown deadline={apptDeadline} label="触发截止" />
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full"
                  onClick={() => action("trigger", { mode: "standard" })}
                >
                  触发神圣座位
                </Button>
              </>
            )}
            {node.state === "executing" && (
              <>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!node.activeSessionId}
                  onClick={async () => {
                    if (!node.activeSessionId) return;
                    await mutateCtdp({
                      url: `/api/focus-sessions/${node.activeSessionId}/complete`,
                      init: {
                        method: "POST",
                        body: { action: "complete" },
                      },
                      optimistic: () =>
                        patchNode(node.id, {
                          awaitingJudgment: true,
                          judgmentReason: "session_complete",
                        }),
                      mapResult: applyApiNode,
                    });
                  }}
                >
                  完成专注
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="w-full"
                  onClick={() => action("abandon")}
                >
                  放弃
                </Button>
              </>
            )}
            {node.awaitingJudgment && (
              <CtdpJudgePanel
                nodeId={node.id}
                judgmentRule={node.judgmentRule}
                reason={node.judgmentReason}
                onResolved={onClose}
              />
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {mode === "edit" && node && (
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                if (!confirm("确定删除此节点？")) return;
                const snapshot = [...allNodes];
                try {
                  await mutateCtdp({
                    url: `/api/ctdp/nodes/${node.id}`,
                    init: { method: "DELETE" },
                    optimistic: () => removeNode(node.id),
                    rollback: () => snapshot.forEach((n) => upsertNode(n)),
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof ServerMutationError ? e.message : "删除失败");
                }
              }}
            >
              删除
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {mode === "create" ? "创建" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
