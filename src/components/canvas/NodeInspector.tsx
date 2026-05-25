"use client";

import { useEffect, useState } from "react";
import { Hairline } from "@/components/ui/Hairline";
import type { InspectorTarget } from "@/components/canvas/types";
import {
  CtdpNodeInspectorSection,
  inspectorKindLabel,
  PolicyInspectorSection,
  PolicyRootInspectorSection,
  SacredSeatInspectorSection,
} from "@/components/canvas/inspectors/NodeInspectorSections";
import { useServerMutation } from "@/hooks/use-server-mutation";

type InspectorProps = {
  target: InspectorTarget;
  onClose: () => void;
  extraActions?: React.ReactNode;
  revalidate?: () => void | Promise<void>;
};

export function NodeInspector({ target, onClose, extraActions, revalidate }: InspectorProps) {
  const { mutate } = useServerMutation();
  const [title, setTitle] = useState("");
  const [trigger, setTrigger] = useState("");
  const [minFocus, setMinFocus] = useState(60);
  const [policyType, setPolicyType] = useState("passive");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!target) return;
    setError("");
    if (target.kind === "sacredSeat") {
      setTitle(target.data.label);
      setTrigger((target.data.meta?.triggerPayload as string) ?? "");
      setMinFocus((target.data.meta?.minFocusMinutes as number) ?? 60);
    }
    if (target.kind === "policy" || target.kind === "policyOrphan") {
      setTitle(target.data.label);
      setPolicyType((target.data.meta?.type as string) ?? "passive");
    }
    if (target.kind === "ctdpNode") {
      setTitle(target.data.label);
    }
  }, [target]);

  if (!target) return null;

  async function save() {
    if (!target) return;
    setSaving(true);
    setError("");
    try {
      if (target.kind === "sacredSeat") {
        await mutate({
          url: `/api/sacred-seats/${target.entityId}`,
          init: {
            method: "PATCH",
            body: {
              name: title,
              triggerPayload: trigger,
              minFocusMinutes: minFocus,
            },
          },
          revalidate,
        });
      } else if (target.kind === "policy" || target.kind === "policyOrphan") {
        const policyId =
          target.kind === "policyOrphan"
            ? target.entityId
            : (target.data.meta?.policyId as string) ?? target.entityId;
        await mutate({
          url: `/api/policies/${policyId}`,
          init: { method: "PATCH", body: { title, type: policyType } },
          revalidate,
        });
      } else if (target.kind === "ctdpNode") {
        await mutate({
          url: `/api/ctdp/nodes/${target.entityId}`,
          init: { method: "PATCH", body: { title } },
          revalidate,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!target) return;
    if (!confirm("确定删除？")) return;
    try {
      if (target.kind === "policyOrphan") {
        await mutate({
          url: `/api/policies/${target.entityId}`,
          init: { method: "DELETE" },
          revalidate,
        });
      } else if (target.kind === "policy") {
        const nodeId = target.data.meta?.nodeId as string;
        if (nodeId) {
          await mutate({
            url: `/api/policy-tree/nodes/${nodeId}`,
            init: { method: "DELETE" },
            revalidate,
          });
        }
      } else if (target.kind === "ctdpNode") {
        await mutate({
          url: `/api/ctdp/nodes/${target.entityId}`,
          init: { method: "DELETE" },
          revalidate,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  return (
    <aside
      className="w-full shrink-0 overflow-y-auto rounded-sm border border-rule bg-panel p-4 space-y-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:max-h-[50dvh] max-md:rounded-t-sm max-md:shadow-lg max-md:border-x-0 max-md:border-b-0 md:w-80 md:static md:max-h-none"
      aria-label="节点检查器"
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="section-marker">Inspector</p>
          <h3 className="mt-3 text-headline-zh text-xl leading-snug">{inspectorKindLabel[target.kind]}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-ink-muted hover:text-ink text-sm"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>
      <Hairline />

      {target.kind === "sacredSeat" && (
        <SacredSeatInspectorSection
          title={title}
          setTitle={setTitle}
          trigger={trigger}
          setTrigger={setTrigger}
          minFocus={minFocus}
          setMinFocus={setMinFocus}
          saving={saving}
          onSave={save}
        />
      )}

      {(target.kind === "policy" || target.kind === "policyOrphan") && (
        <PolicyInspectorSection
          title={title}
          setTitle={setTitle}
          policyType={policyType}
          setPolicyType={setPolicyType}
          saving={saving}
          onSave={save}
          onRemove={remove}
        />
      )}

      {target.kind === "ctdpNode" && (
        <CtdpNodeInspectorSection
          title={title}
          setTitle={setTitle}
          saving={saving}
          onSave={save}
          onRemove={remove}
        />
      )}

      {target.kind === "policyRoot" && <PolicyRootInspectorSection target={target} />}

      {extraActions}
      {error && <p className="text-xs text-signal">{error}</p>}
    </aside>
  );
}
