"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import {
  RsipDataProvider,
  useRsipData,
  type RsipGroup,
  type RsipHabit,
  type RsipPolicy,
  type RsipTreeNode,
} from "@/components/rsip/RsipDataContext";

type Template = { id: string; slug: string; title: string; description: string | null };

const RsipCanvas = dynamic(
  () => import("@/components/canvas/RsipCanvas").then((m) => ({ default: m.RsipCanvas })),
  { ssr: false },
);

function RsipClientInner({ templates }: { templates: Template[] }) {
  const { policies, groups, habits, mutate, addPolicy, addGroup, refetchRsip } = useRsipData();
  const [canvasReady, setCanvasReady] = useState(false);
  const [steadyState, setSteadyState] = useState("沙发放纵");
  const [backtrack, setBacktrack] = useState("躺沙发|带手机上沙发|拿起手机");
  const [groupName, setGroupName] = useState("");
  const [groupPolicies, setGroupPolicies] = useState<string[]>([]);

  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setCanvasReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      setCanvasReady(false);
    };
  }, []);

  async function cloneTemplate(templateId: string) {
    const data = await mutate<RsipPolicy>({
      url: "/api/policies/templates",
      init: { method: "POST", body: { templateId } },
      revalidate: refetchRsip,
    });
    addPolicy(data);
  }

  async function wizard() {
    const steps = backtrack.split("|").map((d, i) => ({
      description: d.trim(),
      tendencyGap: 0.9 - i * 0.15,
    }));
    await mutate({
      url: "/api/policies/wizard",
      init: {
        method: "POST",
        body: {
          steadyStateTarget: steadyState,
          backtrackSteps: steps,
          interventionIndex: steps.length - 1,
          save: true,
        },
      },
      revalidate: refetchRsip,
    });
  }

  async function createGroup() {
    if (!groupName || groupPolicies.length < 2) return;
    const data = await mutate<RsipGroup>({
      url: "/api/policy-groups",
      init: {
        method: "POST",
        body: {
          name: groupName,
          faultQuota: 1,
          policyIds: groupPolicies,
        },
      },
      revalidate: refetchRsip,
    });
    addGroup(data);
    setGroupName("");
    setGroupPolicies([]);
  }

  return (
    <div className="space-y-8">
      <section className="hairline-b pb-6" data-reveal>
        <p className="section-marker mb-4">RSIP</p>
        <h2 className="text-headline-zh">国策树</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted">
          树的挂载、迁移、点亮、熄灭与每日满足记录。
        </p>
        <dl className="app-stat-row mt-4" data-stagger>
          <div>
            <dt>Policies</dt>
            <dd>{policies.length}</dd>
          </div>
          <div>
            <dt>Groups</dt>
            <dd>{groups.length}</dd>
          </div>
          <div>
            <dt>Habits</dt>
            <dd>{habits.length}</dd>
          </div>
        </dl>
        <div className="mt-6 ctdp-flow-wrap ctdp-flow-wrap--mobile min-h-0">
          {canvasReady ? (
            <RsipCanvas />
          ) : (
            <div
              className="relative w-full h-[min(480px,70vh)] overflow-hidden bg-panel animate-pulse"
              aria-hidden
            />
          )}
        </div>
      </section>

      <section className="grid gap-6 md:gap-8 grid-cols-1 xl:grid-cols-[1.05fr_0.95fr]" data-reveal>
        <div className="space-y-8">
          <div>
            <p className="section-marker mb-4">Template Library</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{t.title}</CardTitle>
                  </CardHeader>
                  <CardBody className="mt-auto pt-0">
                    {t.description && (
                      <p className="mb-4 text-sm text-ink-muted leading-relaxed">{t.description}</p>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full min-h-11"
                      onClick={() => cloneTemplate(t.id)}
                    >
                      克隆
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <div className="hairline-t pt-8">
            <p className="section-marker mb-4">Design Wizard</p>
            <h3 className="text-headline-zh text-2xl">设计向导</h3>
            <div className="mt-5 space-y-4">
              <Field label="负面稳态">
                <Input value={steadyState} onChange={(e) => setSteadyState(e.target.value)} />
              </Field>
              <Field label="回溯链（| 分隔）" hint="从后果到最早干预节点">
                <Input value={backtrack} onChange={(e) => setBacktrack(e.target.value)} />
              </Field>
              <Button onClick={wizard} className="w-full md:w-auto min-h-11">
                生成并保存国策
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="hairline-t pt-8">
            <p className="section-marker mb-4">Habit Internalization</p>
            <h3 className="text-headline-zh text-2xl">习惯内化</h3>
            <div className="mt-5 space-y-4">
              {habits.length === 0 ? (
                <p className="text-sm text-ink-muted">暂无习惯进度（树重置不丢失）</p>
              ) : (
                habits.map((h) => (
                  <div key={h.policy.id} className="hairline-b py-4">
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span>{h.policy.title}</span>
                      <span className="font-data text-ink-muted">
                        {h.internalizationDays}d 连续 · {h.lifetimeDays}d 累计
                      </span>
                    </div>
                    <Progress value={h.internalizationDays} max={30} variant="success" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="hairline-t pt-8">
            <p className="section-marker mb-4">Policy Groups</p>
            <h3 className="text-headline-zh text-2xl">国策组</h3>
            <div className="mt-5 space-y-5">
              <div className="hairline-b pb-5">
                <Field label="组名">
                  <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                </Field>
                <p className="mb-3 text-xs text-ink-muted">选择至少 2 项国策（容错 quota=1）</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {policies.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded-sm border border-rule px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={groupPolicies.includes(p.id)}
                        onChange={(e) => {
                          setGroupPolicies((prev) =>
                            e.target.checked
                              ? [...prev, p.id]
                              : prev.filter((id) => id !== p.id),
                          );
                        }}
                        className="rounded-sm"
                      />
                      {p.title}
                    </label>
                  ))}
                </div>
                <Button variant="secondary" onClick={createGroup} className="w-full md:w-auto min-h-11">
                  创建国策组
                </Button>
              </div>

              <div className="space-y-3">
                {groups.map((g) => (
                  <Card key={g.id}>
                    <CardBody>
                      <p className="text-sm font-medium">
                        {g.name} <Badge variant="outline">容错 {g.faultQuota}</Badge>
                      </p>
                      <p className="mt-3 text-xs text-ink-muted">
                        {g.members.map((m) => m.policy.title).join(" · ")}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RsipClient({
  policies,
  templates,
  tree,
  groups,
  habits,
}: {
  policies: RsipPolicy[];
  templates: Template[];
  tree: { nodes: RsipTreeNode[] } | null;
  groups: RsipGroup[];
  habits: RsipHabit[];
}) {
  const treeNodes = tree?.nodes ?? [];

  return (
    <RsipDataProvider
      initialPolicies={policies}
      initialTreeNodes={treeNodes}
      initialGroups={groups}
      initialHabits={habits}
    >
      <RsipClientInner templates={templates} />
    </RsipDataProvider>
  );
}
