"use client";

import { HeroWavesInteractive } from "@/components/marketing/HeroWavesInteractive";

export function DashboardHeroBand({
  pct,
  nodeCount,
  successCount,
  activePolicies,
}: {
  pct: number;
  nodeCount: number;
  successCount: number;
  activePolicies: number;
}) {
  return (
    <section className="dashboard-hero-band" aria-label="网络完整度">
      <div className="dashboard-hero-band__stage-wrap">
        <HeroWavesInteractive variant="dashboard" interactiveMode="immediate" />
        <div className="dashboard-hero-band__overlay">
          <p className="section-marker mb-3">Network Completeness</p>
          <p className="text-display">
            {pct}
            <span className="text-2xl align-top">%</span>
          </p>
          <p className="mt-3 max-w-2xl text-editorial-body text-sm md:text-base">
            网络完整度 · {nodeCount} 个节点，{successCount} 个已结案，活跃国策 {activePolicies} 项。
          </p>
          <dl className="app-stat-row mt-4 border-b-0 pb-0">
            <div>
              <dt>Node Forest</dt>
              <dd>{nodeCount}</dd>
            </div>
            <div>
              <dt>Policy Tree</dt>
              <dd>{activePolicies}</dd>
            </div>
            <div>
              <dt>Success</dt>
              <dd>{successCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
