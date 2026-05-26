"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { JudgeVerdict } from "@/lib/domain/ctdp-node";
import { mapApiNodeToRow } from "@/components/ctdp/ctdp-node-mapper";
import { useCtdpForestMutation } from "@/components/ctdp/CtdpNodesContext";
import { ServerMutationError } from "@/lib/mutations/server-mutation";

export function CtdpJudgeModal({
  nodeId,
  judgmentRule,
  onClose,
  onResolved,
}: {
  nodeId: string;
  judgmentRule?: string | null;
  onClose: () => void;
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
      onClose();
    } catch (e) {
      setError(e instanceof ServerMutationError ? e.message : "判定失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30"
      role="dialog"
      aria-modal
      aria-labelledby="ctdp-judge-title"
    >
      <div className="w-full max-w-[calc(100%-2rem)] sm:max-w-sm rounded-sm border border-rule bg-panel shadow-xl p-5 space-y-4 mx-auto">
        <h2 id="ctdp-judge-title" className="font-serif text-lg">
          判定
        </h2>

        {error && <p className="text-sm text-signal">{error}</p>}

        {judgmentRule && (
          <p className="text-sm text-ink-muted whitespace-pre-wrap border border-rule rounded-sm p-3">
            当前规则：{judgmentRule}
          </p>
        )}

        <Input
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
          placeholder="新规则（成功+新规则时填写）"
          disabled={loading}
        />

        <div className="flex flex-col gap-2">
          <Button size="sm" disabled={loading} onClick={() => judge("success")}>
            完全成功
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || !ruleText.trim()}
            onClick={() => judge("rule_fix")}
          >
            成功+新规则
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={loading}
            onClick={() => judge("total_fail")}
          >
            完全失败
          </Button>
        </div>
      </div>
    </div>
  );
}
