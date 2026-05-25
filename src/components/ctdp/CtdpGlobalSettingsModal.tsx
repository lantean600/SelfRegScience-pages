"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCtdpNodes } from "@/components/ctdp/CtdpNodesContext";
import { useServerMutation } from "@/hooks/use-server-mutation";
import { Field, Input } from "@/components/ui/Field";
import {
  DEFAULT_CTDP_UI_SETTINGS,
  type CtdpNodeStateKey,
  type CtdpUiSettings,
} from "@/lib/ctdp-ui-settings";
import { useCtdpSettings } from "@/components/ctdp/CtdpSettingsContext";

const STATE_LABELS: Record<CtdpNodeStateKey, string> = {
  initial: "初始",
  executing: "执行中",
  success: "成功",
  failed: "失败",
};

export function CtdpGlobalSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { seats, addSeat } = useCtdpNodes();
  const { mutate } = useServerMutation();
  const { settings, setSettings } = useCtdpSettings();
  const [draft, setDraft] = useState<CtdpUiSettings>(settings);
  const [seatName, setSeatName] = useState("");
  const [seatTrigger, setSeatTrigger] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    try {
      setSettings(draft);
      await mutate({
        url: "/api/user/settings",
        init: {
          method: "PATCH",
          body: {
            defaultAppointmentMin: draft.appointmentMinutes,
            defaultFocusMinutes: draft.defaultFocusMinutes,
          },
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function createSeat() {
    if (!seatName.trim() || !seatTrigger.trim()) return;
    const data = await mutate<{ id: string; name: string }>({
      url: "/api/sacred-seats",
      init: {
        method: "POST",
        body: { name: seatName, triggerPayload: seatTrigger },
      },
    });
    addSeat({ id: data.id, name: data.name });
    setSeatName("");
    setSeatTrigger("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30"
      role="dialog"
      aria-modal
      aria-labelledby="ctdp-settings-title"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-sm border border-rule bg-panel shadow-xl p-5 space-y-5">
        <div className="flex justify-between items-start gap-2">
          <h2 id="ctdp-settings-title" className="font-serif text-xl">
            CTDP 全局配置
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-sm"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-ink-muted font-data">
            节点颜色
          </p>
          {(Object.keys(STATE_LABELS) as CtdpNodeStateKey[]).map((key) => (
            <Field key={key} label={STATE_LABELS[key]}>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.nodeColors[key]}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      nodeColors: { ...d.nodeColors, [key]: e.target.value },
                    }))
                  }
                  className="h-9 w-12 rounded-sm border border-rule cursor-pointer"
                />
                <Input
                  value={draft.nodeColors[key]}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      nodeColors: { ...d.nodeColors, [key]: e.target.value },
                    }))
                  }
                  className="font-data text-xs"
                />
              </div>
            </Field>
          ))}
          <Field label="引用箭头颜色">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={draft.edgeColor}
                onChange={(e) => setDraft((d) => ({ ...d, edgeColor: e.target.value }))}
                className="h-9 w-12 rounded-sm border border-rule cursor-pointer"
              />
              <Input
                value={draft.edgeColor}
                onChange={(e) => setDraft((d) => ({ ...d, edgeColor: e.target.value }))}
                className="font-data text-xs"
              />
            </div>
          </Field>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                nodeColors: { ...DEFAULT_CTDP_UI_SETTINGS.nodeColors },
                edgeColor: DEFAULT_CTDP_UI_SETTINGS.edgeColor,
                forceStrength: DEFAULT_CTDP_UI_SETTINGS.forceStrength,
              }))
            }
          >
            恢复默认配色
          </Button>
        </section>

        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-ink-muted font-data">
            力导向布局
          </p>
          <Field
            label={`引力强度：${draft.forceStrength}`}
            hint="越大节点越分散；保存后自动重新布局"
          >
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={draft.forceStrength}
              onChange={(e) =>
                setDraft((d) => ({ ...d, forceStrength: Number(e.target.value) }))
              }
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-ink-muted font-data mt-1">
              <span>紧凑</span>
              <span>稀疏</span>
            </div>
          </Field>
        </section>

        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-ink-muted font-data">
            时间
          </p>
          <Field label="预约 deadline（分钟）" hint="执行节点后须在此时限内触发座位">
            <Input
              type="number"
              min={1}
              max={240}
              value={draft.appointmentMinutes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, appointmentMinutes: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="默认专注时长（分钟）">
            <Input
              type="number"
              min={5}
              max={480}
              value={draft.defaultFocusMinutes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, defaultFocusMinutes: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="节点直径（像素）">
            <Input
              type="number"
              min={36}
              max={96}
              value={draft.nodeSize}
              onChange={(e) => setDraft((d) => ({ ...d, nodeSize: Number(e.target.value) }))}
            />
          </Field>
          <Field
            label="显示标题的缩放阈值"
            hint="画布放大超过此值时显示节点标题（0.5–1.5）"
          >
            <Input
              type="number"
              min={0.5}
              max={1.5}
              step={0.05}
              value={draft.labelZoomThreshold}
              onChange={(e) =>
                setDraft((d) => ({ ...d, labelZoomThreshold: Number(e.target.value) }))
              }
            />
          </Field>
        </section>

        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-ink-muted font-data">
            神圣座位
          </p>
          {seats.length > 0 ? (
            <ul className="text-sm text-ink-muted space-y-1">
              {seats.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-signal">尚无座位，请先创建。</p>
          )}
          <div className="grid gap-2">
            <Input
              placeholder="座位名称"
              value={seatName}
              onChange={(e) => setSeatName(e.target.value)}
            />
            <Input
              placeholder="触发描述"
              value={seatTrigger}
              onChange={(e) => setSeatTrigger(e.target.value)}
            />
            <Button size="sm" variant="secondary" onClick={createSeat}>
              添加座位
            </Button>
          </div>
        </section>

        <div className="flex gap-2 justify-end pt-2 border-t border-rule">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save} disabled={saving}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
