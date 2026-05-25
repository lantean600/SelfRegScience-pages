import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import type { CanvasNodeKind, InspectorTarget } from "@/components/canvas/types";

type SharedSectionProps = {
  title: string;
  setTitle: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  onRemove?: () => void;
};

export const inspectorKindLabel: Record<CanvasNodeKind, string> = {
  ctdpNode: "任务节点",
  sacredSeat: "神圣座位",
  mainChain: "主链",
  appointment: "预约",
  focusSession: "专注会话",
  policy: "国策节点",
  policyRoot: "国策根",
  policyOrphan: "未挂载国策",
  echelon: "任务群",
  group: "任务组",
  unit: "任务单元",
};

export function SacredSeatInspectorSection({
  title,
  setTitle,
  trigger,
  setTrigger,
  minFocus,
  setMinFocus,
  saving,
  onSave,
}: SharedSectionProps & {
  trigger: string;
  setTrigger: (value: string) => void;
  minFocus: number;
  setMinFocus: (value: number) => void;
}) {
  return (
    <>
      <Field label="名称 / 标题">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="触发描述">
        <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} />
      </Field>
      <Field label="最短专注（分钟）">
        <Input
          type="number"
          value={minFocus}
          onChange={(e) => setMinFocus(Number(e.target.value))}
        />
      </Field>
      <Button size="sm" onClick={onSave} disabled={saving}>
        保存
      </Button>
    </>
  );
}

export function PolicyInspectorSection({
  title,
  setTitle,
  policyType,
  setPolicyType,
  saving,
  onSave,
  onRemove,
}: SharedSectionProps & {
  policyType: string;
  setPolicyType: (value: string) => void;
}) {
  return (
    <>
      <Field label="名称 / 标题">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="类型">
        <Select value={policyType} onChange={(e) => setPolicyType(e.target.value)}>
          <option value="passive">被动</option>
          <option value="semi_passive">半被动</option>
          <option value="active">主动</option>
        </Select>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          保存
        </Button>
        {onRemove && (
          <Button size="sm" variant="danger" onClick={onRemove}>
            删除
          </Button>
        )}
      </div>
    </>
  );
}

export function CtdpNodeInspectorSection({
  title,
  setTitle,
  saving,
  onSave,
  onRemove,
}: SharedSectionProps) {
  return (
    <>
      <Field label="名称 / 标题">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          保存
        </Button>
        {onRemove && (
          <Button size="sm" variant="danger" onClick={onRemove}>
            删除
          </Button>
        )}
      </div>
    </>
  );
}

export function PolicyRootInspectorSection({ target }: { target: NonNullable<InspectorTarget> }) {
  return (
    <div className="text-sm text-ink-muted space-y-2">
      <p>
        <strong className="text-ink">{target.data.label}</strong>
      </p>
      {target.data.sublabel && <p>{target.data.sublabel}</p>}
      <p className="text-xs">双击其他可编辑节点以修改属性。</p>
    </div>
  );
}
