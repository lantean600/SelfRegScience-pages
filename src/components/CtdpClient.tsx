"use client";

import { CtdpCanvas } from "@/components/canvas/CtdpCanvas";
import { CtdpSettingsProvider } from "@/components/ctdp/CtdpSettingsContext";
import { CtdpNodesProvider, useCtdpNodes } from "@/components/ctdp/CtdpNodesContext";
import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";

function CtdpStatusBar() {
  const { nodes, completeness, seats } = useCtdpNodes();
  const pct = Math.round(completeness * 100);
  const executing = nodes.filter((n) => n.state === "executing").length;
  const awaiting = nodes.filter((n) => n.awaitingJudgment).length;
  const armed = nodes.filter((n) => n.pendingAppointmentId && !n.awaitingJudgment).length;

  return (
    <section className="hairline-b pb-6 mb-6" data-reveal>
      <p className="section-marker mb-4">CTDP</p>
      <p className="text-display">
        {pct}
        <span className="text-2xl align-top">%</span>
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        {nodes.length} 个节点 · 完整度统计成功节点的引用权重。
      </p>
      <dl className="app-stat-row mt-4">
        <div>
          <dt>Executing</dt>
          <dd>{executing}</dd>
        </div>
        <div>
          <dt>Armed</dt>
          <dd>{armed}</dd>
        </div>
        <div>
          <dt>Judgment</dt>
          <dd>{awaiting}</dd>
        </div>
        <div>
          <dt>Seats</dt>
          <dd>{seats.length}</dd>
        </div>
      </dl>
    </section>
  );
}

export function CtdpClient({
  nodes,
  completeness,
  seats,
  defaultAppointmentMin,
  defaultFocusMinutes,
}: {
  nodes: CtdpNodeRow[];
  completeness: number;
  seats: { id: string; name: string }[];
  defaultAppointmentMin: number;
  defaultFocusMinutes: number;
}) {
  return (
    <CtdpSettingsProvider
      serverDefaults={{ appointmentMinutes: defaultAppointmentMin, defaultFocusMinutes }}
    >
      <CtdpNodesProvider
        initialNodes={nodes}
        initialCompleteness={completeness}
        initialSeats={seats}
      >
        <div className="space-y-4">
          <CtdpStatusBar />
          <CtdpCanvas />
        </div>
      </CtdpNodesProvider>
    </CtdpSettingsProvider>
  );
}
