"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { LegalBlock } from "@/components/ui/LegalBlock";
import type { JudgeVerdict } from "@/lib/domain/ctdp-node";
import { mapApiNodeToRow } from "@/components/ctdp/ctdp-node-mapper";
import { useCtdpForestMutation } from "@/components/ctdp/CtdpNodesContext";
import { ServerMutationError } from "@/lib/mutations/server-mutation";

export function CtdpJudgePanel({
  nodeId,
  judgmentRule,
  reason,
  onResolved,
}: {
  nodeId: string;
  judgmentRule?: string | null;
  reason?: string | null;
  onResolved?: () => void;
}) {
  const { mutateCtdp, upsertNode } = useCtdpForestMutation();
  const [ruleText, setRuleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function judge(verdict: JudgeVerdict) {
    setLoading(true);
    setError("");
    try {
      await mutateCtdp({
        url: `/api/ctdp/nodes/${nodeId}/judge`,
        init: {
          method: "POST",
          body: {
            verdict,
            ruleText: verdict === "rule_fix" ? ruleText : undefined,
            behaviorKey: "rule_exception",
          },
        },
        mapResult: (data) => {
          if (Array.isArray(data)) {
            data.forEach((n) =>
              upsertNode(mapApiNodeToRow(n as Parameters<typeof mapApiNodeToRow>[0])),
            );
          } else if (data && typeof data === "object" && "id" in data) {
            upsertNode(mapApiNodeToRow(data as Parameters<typeof mapApiNodeToRow>[0]));
          }
        },
      });
      onResolved?.();
    } catch (e) {
      setError(e instanceof ServerMutationError ? e.message : "判定失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-signal">{error}</p>}
      {reason && (
        <p className="text-xs text-ink-muted">
          {reason === "missed_trigger" ? "逾期未触发 · 待判定" : "专注完成 · 待判定"}
        </p>
      )}
      {judgmentRule && (
        <p className="text-xs text-ink-muted whitespace-pre-wrap border border-rule rounded-sm p-2">
          当前规则：{judgmentRule}
        </p>
      )}
      <Field label="规则修正（选项一）">
        <Input
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
          placeholder="例如：允许任务执行时刷哔哩哔哩"
          disabled={loading}
        />
      </Field>
      <LegalBlock prefix="§">
        选项一将写入判定规则并记为成功；选项二为彻底失败并沿引用方向传播。
      </LegalBlock>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={loading} onClick={() => judge("success")}>
          判定成功
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={loading || !ruleText.trim()}
          onClick={() => judge("rule_fix")}
        >
          规则修正 → 成功
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={loading}
          onClick={() => judge("total_fail")}
        >
          彻底失败
        </Button>
      </div>
    </div>
  );
}
