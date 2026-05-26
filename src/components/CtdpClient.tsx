"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CtdpSettingsProvider } from "@/components/ctdp/CtdpSettingsContext";
import { CtdpNodesProvider, useCtdpNodes } from "@/components/ctdp/CtdpNodesContext";
import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";

const CtdpCanvas = dynamic(
  () => import("@/components/canvas/CtdpCanvas").then((m) => ({ default: m.CtdpCanvas })),
  { ssr: false },
);

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
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setCanvasReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
          {canvasReady ? (
            <CtdpCanvas />
          ) : (
            <div
              className="ctdp-flow-wrap ctdp-flow-wrap--mobile relative w-full h-[min(700px,82vh)] overflow-hidden bg-panel animate-pulse"
              aria-hidden
            />
          )}
        </div>
      </CtdpNodesProvider>
    </CtdpSettingsProvider>
  );
}
