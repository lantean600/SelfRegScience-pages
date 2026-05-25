"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { canvasNodeTypes } from "@/components/canvas/nodeTypes";
import { canvasEdgeTypes } from "@/components/canvas/edgeTypes";
import { CtdpSettingsProvider } from "@/components/ctdp/CtdpSettingsContext";
import { CtdpZoomProvider } from "@/components/ctdp/CtdpZoomContext";
import { theoryGlossary } from "@/lib/theory-glossary";

const ZHIHU_SOURCE =
  "https://www.zhihu.com/question/19888447/answer/1930799480401293785";

type GuideStep = {
  title: string;
  caption: string;
  detail: string;
  highlight: string[];
  nodes: Node[];
  edges: Edge[];
};

function demoNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  meta: Record<string, unknown>,
): Node {
  return {
    id,
    type: "ctdpNode",
    position,
    data: {
      kind: "ctdpNode",
      label,
      entityId: `demo-${id}`,
      meta,
    },
  };
}

/** CTDP 节点森林 — 与 CONTEXT.md 执行链一致的分步演示 */
const ctdpSteps: GuideStep[] = [
  {
    title: "01 — 节点森林与引用边",
    caption: "任务以森林组织：每个节点至多引用一个下游节点（出边 → 被引用者）。",
    detail:
      "「写报告」引用「查资料」：箭头从引用者指向被引用者。引用属性 refCount 统计该节点在结构上的权重；网络完整度 = 成功节点 refCount 之和 / 全部节点 refCount 之和。森林可有多棵互不相连的子树。",
    highlight: ["a", "b"],
    nodes: [
      demoNode("a", "写报告", { x: 0, y: 0 }, { state: "initial", refCount: 2 }),
      demoNode("b", "查资料", { x: 220, y: 90 }, { state: "initial", refCount: 1 }),
      demoNode("c", "整理提纲", { x: 420, y: 0 }, { state: "initial", refCount: 0 }),
    ],
    edges: [
      { id: "e1", source: "a", target: "b", type: "refTarget" },
      { id: "e2", source: "b", target: "c", type: "refTarget" },
    ],
  },
  {
    title: "02 — 创建初始节点",
    caption: "在 CTDP 画布右键或点击 + 新建节点，状态为 initial（待执行）。",
    detail:
      "新建时可指定标题与可选的引用目标。未连边的节点独立成树；连接 refTarget 后结构变更会重算 refCount。节点拖曳位置会静默保存，不影响力导向布局的即时显示。",
    highlight: ["new"],
    nodes: [
      demoNode("a", "写报告", { x: 80, y: 20 }, { state: "initial", refCount: 1 }),
      demoNode("new", "新任务", { x: 280, y: 100 }, { state: "initial", refCount: 0 }),
    ],
    edges: [{ id: "e1", source: "a", target: "new", type: "refTarget" }],
  },
  {
    title: "03 — 执行（arm）",
    caption: "对 initial 节点「执行」→ 创建预约（warning bell），须在 deadline 前触发神圣座位。",
    detail:
      "执行后节点出现待触发环（armed）。预约绑定神圣座位与信号；全局配置中可设置默认预约时长与专注时长。若尚未创建座位，需先在画布配置中创建。",
    highlight: ["a"],
    nodes: [
      demoNode("a", "写报告", { x: 120, y: 40 }, { state: "initial", refCount: 1, armed: true }),
    ],
    edges: [],
  },
  {
    title: "04 — 触发神圣座位",
    caption: "deadline 内触发座位 → 节点进入 executing，并开启专注会话。",
    detail:
      "触发是承诺进入专注的仪式动作。会话与节点绑定；同一时刻可有多节点处于不同状态，但每个节点的状态机独立推进。",
    highlight: ["a"],
    nodes: [
      demoNode("a", "写报告", { x: 120, y: 40 }, { state: "executing", refCount: 1 }),
    ],
    edges: [],
  },
  {
    title: "05 — 完成专注 → 待判定",
    caption: "专注会话正常结束 → awaitingJudgment（待判定），尚未写入成功或失败。",
    detail:
      "完成专注不会自动记为成功，必须经裁决面板给出结论。此时可查看 judgmentReason（如 session_complete）。",
    highlight: ["a"],
    nodes: [
      demoNode(
        "a",
        "写报告",
        { x: 120, y: 40 },
        { state: "executing", refCount: 1, awaitingJudgment: true },
      ),
    ],
    edges: [],
  },
  {
    title: "06 — 判定：成功与规则修正",
    caption: "待判定节点可裁定为：成功 · 规则修正→成功 · 彻底失败。",
    detail:
      "判定成功：节点变为 success，计入完整度。规则修正：写入 judgmentRule（下必为例的判例文本），仍记 success。彻底失败见下一步。成功节点的 initial 上游不受影响。",
    highlight: ["a"],
    nodes: [
      demoNode("a", "写报告", { x: 120, y: 40 }, { state: "success", refCount: 1 }),
    ],
    edges: [],
  },
  {
    title: "07 — 逾期未触发",
    caption: "预约 deadline 内未触发座位 → 不经过 executing，直接进入待判定。",
    detail:
      "这是辅助链断裂的一种：节点从未进入专注态，但仍需裁决（missed_trigger）。你可以选择成功、规则修正或彻底失败，逻辑与专注完成后的待判定相同。",
    highlight: ["a"],
    nodes: [
      demoNode(
        "a",
        "写报告",
        { x: 120, y: 40 },
        { state: "initial", refCount: 1, awaitingJudgment: true },
      ),
    ],
    edges: [],
  },
  {
    title: "08 — 彻底失败",
    caption: "裁决为彻底失败 → 节点变为 failed，并沿出边启动失败传播。",
    detail:
      "彻底失败表示该任务在协议意义上不可接受，需要承担向下游传导的后果。规则修正与彻底失败二选一，前者保留成功态并更新规则库。",
    highlight: ["a"],
    nodes: [
      demoNode("a", "写报告", { x: 0, y: 0 }, { state: "failed", refCount: 2 }),
      demoNode("b", "查资料", { x: 220, y: 90 }, { state: "success", refCount: 1 }),
      demoNode("c", "整理提纲", { x: 420, y: 0 }, { state: "initial", refCount: 0 }),
    ],
    edges: [
      { id: "e1", source: "a", target: "b", type: "refTarget" },
      { id: "e2", source: "b", target: "c", type: "refTarget" },
    ],
  },
  {
    title: "09 — 执行中放弃",
    caption: "executing 期间主动放弃 → 直接 failed，跳过待判定，并触发传播。",
    detail:
      "放弃是执行者主动中断承诺，系统立即标记失败并向下游传导，与「彻底失败」裁决的传播规则相同。",
    highlight: ["a"],
    nodes: [
      demoNode("a", "写报告", { x: 120, y: 40 }, { state: "failed", refCount: 1 }),
    ],
    edges: [],
  },
  {
    title: "10 — 失败传播规则",
    caption: "沿出边向下：success / executing → failed；initial 保持不变。",
    detail:
      "图示：上游「写报告」已 failed 后，下游曾为 success 的「查资料」被传导为 failed；仍为 initial 的「整理提纲」不受影响。传播不逆流、不修改 initial 上游。",
    highlight: ["a", "b"],
    nodes: [
      demoNode("a", "写报告", { x: 0, y: 0 }, { state: "failed", refCount: 2 }),
      demoNode("b", "查资料", { x: 220, y: 90 }, { state: "failed", refCount: 1 }),
      demoNode("c", "整理提纲", { x: 420, y: 0 }, { state: "initial", refCount: 0 }),
    ],
    edges: [
      { id: "e1", source: "a", target: "b", type: "refTarget" },
      { id: "e2", source: "b", target: "c", type: "refTarget" },
    ],
  },
  {
    title: "11 — 汇合节点阻断传播",
    caption: "入度 ≥ 2 的节点：处理完该节点后，停止继续向下传播。",
    detail:
      "「汇总」被「分支 A」「分支 B」同时引用。当分支 A 失败并传到汇总后，系统在该汇合点停止，不会继续波及更下游的「后续任务」——避免多路径重复惩罚。",
    highlight: ["merge", "a"],
    nodes: [
      demoNode("a", "分支 A", { x: 0, y: 0 }, { state: "failed", refCount: 1 }),
      demoNode("b", "分支 B", { x: 0, y: 120 }, { state: "success", refCount: 0 }),
      demoNode("merge", "汇总", { x: 240, y: 60 }, { state: "failed", refCount: 1 }),
      demoNode("d", "后续任务", { x: 460, y: 60 }, { state: "initial", refCount: 0 }),
    ],
    edges: [
      { id: "e1", source: "a", target: "merge", type: "refTarget" },
      { id: "e2", source: "b", target: "merge", type: "refTarget" },
      { id: "e3", source: "merge", target: "d", type: "refTarget" },
    ],
  },
];

const rsipSteps: GuideStep[] = [
  {
    title: "01 — 克隆国策",
    caption: "从模板库克隆国策，成为可挂载的定式。",
    detail: "模板库提供常见定式；克隆后进入未挂载状态，可拖入国策树。",
    highlight: ["orphan"],
    nodes: [
      {
        id: "orphan",
        type: "policyOrphan",
        position: { x: 0, y: 0 },
        data: { kind: "policyOrphan", label: "先发制人", entityId: "demo", meta: { type: "active" } },
      },
    ],
    edges: [],
  },
  {
    title: "02 — 挂载到树",
    caption: "拖到国策树上挂载；每日最多点亮一个新节点。",
    detail: "连线表示堆栈父子关系；新节点点亮后参与每日打卡。",
    highlight: ["root", "orphan"],
    nodes: [
      {
        id: "root",
        type: "policyRoot",
        position: { x: 200, y: 0 },
        data: { kind: "policyRoot", label: "国策 A", entityId: "demo" },
      },
      {
        id: "orphan",
        type: "policyOrphan",
        position: { x: 0, y: 80 },
        data: { kind: "policyOrphan", label: "国策 B", entityId: "demo" },
      },
    ],
    edges: [{ id: "e1", source: "orphan", target: "root", type: "stack" }],
  },
  {
    title: "03 — 每日打卡",
    caption: "满足则习惯内化累计；未满足需裁决。",
    detail: "右键国策节点可记录当日满足/未满足。",
    highlight: ["child"],
    nodes: [
      {
        id: "root",
        type: "policyRoot",
        position: { x: 100, y: 0 },
        data: { kind: "policyRoot", label: "国策 A", entityId: "demo" },
      },
      {
        id: "child",
        type: "policy",
        position: { x: 100, y: 100 },
        data: {
          kind: "policy",
          label: "国策 B",
          entityId: "demo",
          meta: { type: "semi_passive", status: "active" },
        },
      },
    ],
    edges: [{ id: "e1", source: "root", target: "child", type: "stack" }],
  },
  {
    title: "04 — 子树熄灭",
    caption: "子节点失败时熄灭子树（堆栈回滚），根节点保留。",
    detail: "RSIP 与 CTDP 正交；习惯进度在树重置后仍保留。",
    highlight: ["child"],
    nodes: [
      {
        id: "root",
        type: "policyRoot",
        position: { x: 100, y: 0 },
        data: { kind: "policyRoot", label: "国策 A", entityId: "demo" },
      },
      {
        id: "child",
        type: "policy",
        position: { x: 100, y: 100 },
        data: {
          kind: "policy",
          label: "国策 B",
          entityId: "demo",
          meta: { type: "semi_passive", status: "extinguished" },
        },
      },
    ],
    edges: [{ id: "e1", source: "root", target: "child", type: "stack" }],
  },
];

type Track = "ctdp" | "rsip";

function GuideFlow({ steps, step }: { steps: GuideStep[]; step: number }) {
  const current = steps[step];
  const nodes = useMemo(
    () =>
      current.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          highlighted: current.highlight.includes(n.id),
        },
      })),
    [current],
  );

  const usesCtdp = current.nodes.some((n) => n.type === "ctdpNode");

  const flow = (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={current.edges}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
      >
        <Background gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </ReactFlowProvider>
  );

  return (
    <div className="h-[340px] ctdp-flow-wrap">
      {usesCtdp ? (
        <CtdpSettingsProvider>
          <CtdpZoomProvider labelZoomThreshold={0.5}>{flow}</CtdpZoomProvider>
        </CtdpSettingsProvider>
      ) : (
        flow
      )}
    </div>
  );
}

export function GuideClient({ showHeader = true }: { showHeader?: boolean }) {
  const [track, setTrack] = useState<Track>("ctdp");
  const [step, setStep] = useState(0);
  const steps = track === "ctdp" ? ctdpSteps : rsipSteps;
  const current = steps[step];

  const glossaryKeys =
    track === "ctdp"
      ? (["ctdp_node", "reference_count", "completeness", "sacred_seat", "appointment"] as const)
      : (["policy", "policy_tree", "compartment_freeze"] as const);

  return (
    <div className="space-y-8">
      {showHeader && (
        <header className="hairline-b pb-6" data-page-hero>
          <p className="section-marker mb-4">Chapter 00</p>
          <h1 className="text-headline-zh">交互式协议概览</h1>
          <p className="mt-4 text-editorial-body max-w-prose">
            分轨演示 CTDP 节点森林与 RSIP 国策树的核心机制。
          </p>
        </header>
      )}

      <section className="hairline-b pb-8" data-reveal>
        <div className="grid gap-8 xl:grid-cols-[0.78fr_1.22fr] xl:items-start">
          <div className="space-y-4">
            <div>
              <p className="section-marker mb-4">Theory Origin</p>
              <p className="text-sm text-ink-muted leading-relaxed">
                本应用的链式时延（CTDP）与递归稳态（RSIP）框架，源自知乎作者 edmond
                对「如何提高自制力？」的系统回答。SRS 将其工程化为可裁决、可复盘的任务节点森林。
              </p>
            </div>
            <a
              href={ZHIHU_SOURCE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm text-accent no-underline hover:underline"
            >
              如何提高自制力？ — edmond 的回答（知乎）
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={track === "ctdp" ? "primary" : "rail"}
                onClick={() => {
                  setTrack("ctdp");
                  setStep(0);
                }}
              >
                CTDP 节点森林
              </Button>
              <Button
                size="sm"
                variant={track === "rsip" ? "primary" : "rail"}
                onClick={() => {
                  setTrack("rsip");
                  setStep(0);
                }}
              >
                RSIP 国策树
              </Button>
            </div>

            <dl className="app-stat-row" data-stagger>
              <div>
                <dt>Track</dt>
                <dd>{track.toUpperCase()}</dd>
              </div>
              <div>
                <dt>Step</dt>
                <dd>
                  {step + 1}/{steps.length}
                </dd>
              </div>
            </dl>

            {track === "ctdp" && (
              <Card variant="narrative">
                <CardBody className="px-0 pb-0 text-sm text-ink-muted leading-relaxed space-y-2">
                  <p>
                    <strong className="text-ink">四态</strong>：initial → executing → success /
                    failed。执行链嵌在单节点上：arm → trigger → 专注 → 判定；另有逾期与放弃路径。
                  </p>
                  <p>
                    下列 {ctdpSteps.length} 步按顺序演示创建、执行、状态迁移、裁决与失败传播；可在画布中对照操作。
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="hairline-b py-8" data-reveal>
        <div className="grid gap-8 xl:grid-cols-[0.45fr_1.55fr]">
          <div className="space-y-4">
            <p className="section-marker">Current Step</p>
            <div>
              <p className="text-headline-zh text-2xl">
                {current.title}
              </p>
              <p className="mt-3 text-sm font-medium text-ink">{current.caption}</p>
              <p className="mt-4 text-sm text-ink-muted leading-relaxed">{current.detail}</p>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                上一步
              </Button>
              <span className="font-data text-xs text-ink-muted">
                {step + 1} / {steps.length}
              </span>
              <Button
                size="sm"
                disabled={step >= steps.length - 1}
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              >
                下一步
              </Button>
            </div>
          </div>

          <div>
            <GuideFlow steps={steps} step={step} />
          </div>
        </div>
      </section>

      <section className="space-y-4" data-reveal>
        <p className="section-marker">Glossary</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {glossaryKeys.map((key) => {
            const term = theoryGlossary[key];
            return (
              <li key={key} id={term.anchor} className="hairline-b py-4 text-sm last:border-b-0">
                <strong className="font-display text-base normal-case leading-snug">{term.title}</strong>
                <p className="text-ink-muted mt-2 leading-relaxed">{term.excerpt}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm" data-reveal>
        <Link href={track === "ctdp" ? "/ctdp" : "/rsip"} className="underline">
          打开 {track === "ctdp" ? "CTDP" : "RSIP"} 画布 →
        </Link>
      </p>
    </div>
  );
}
