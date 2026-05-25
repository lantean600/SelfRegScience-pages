import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CronTrigger } from "@/components/CronTrigger";
import { DashboardHeroBand } from "@/components/dashboard/DashboardHeroBand";
import { getNetworkSnapshot } from "@/lib/domain/ctdp-node";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const prisma = await getDb();

  const [snap, tree, notifications, executingNodes, awaitingNodes] =
    await Promise.all([
      getNetworkSnapshot(user.id),
      prisma.policyTree.findFirst({
        where: { userId: user.id, isActive: true },
        include: { nodes: { where: { status: "active" } } },
      }),
      prisma.notification.findMany({
        where: { userId: user.id, read: false },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.ctdpNode.findMany({
        where: { network: { userId: user.id }, state: "executing" },
        take: 3,
      }),
      prisma.ctdpNode.findMany({
        where: { network: { userId: user.id }, awaitingJudgment: true },
        take: 5,
      }),
    ]);

  const activePolicies = tree?.nodes.length ?? 0;
  const pct = Math.round(snap.network.completeness * 100);
  const successCount = snap.nodes.filter((n) => n.state === "success").length;

  return (
    <>
      <PageHeader
        kicker="Overview"
        title="总览"
        description={`${user.email} · 完整度、活跃协议与待裁决节点。`}
        actions={<CronTrigger />}
      />

      <DashboardHeroBand
        pct={pct}
        nodeCount={snap.nodes.length}
        successCount={successCount}
        activePolicies={activePolicies}
      />

      <div className="space-y-10">
        {(executingNodes.length > 0 || awaitingNodes.length > 0) && (
          <section data-reveal className="hairline-t pt-8">
            <p className="section-marker mb-6">Now Processing</p>
            <ul className="space-y-0">
              {executingNodes.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center justify-between gap-4 py-4 hairline-b">
                  <div>
                    <p className="text-kicker text-ink-muted mb-1">执行中</p>
                    <p className="font-display text-xl normal-case">{n.title}</p>
                  </div>
                  <Button href="/ctdp" size="sm">
                    前往 CTDP
                  </Button>
                </li>
              ))}
              {awaitingNodes.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center justify-between gap-4 py-4 hairline-b">
                  <div>
                    <p className="text-kicker text-editorial mb-1">待判定</p>
                    <p className="font-display text-xl normal-case">{n.title}</p>
                  </div>
                  <Button href="/ctdp" variant="danger" size="sm">
                    裁决
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {notifications.length > 0 && (
          <section className="space-y-3" data-reveal>
            <p className="section-marker">Signals</p>
            {notifications.map((n) => (
              <Alert key={n.id} variant="warning">
                {n.message}
              </Alert>
            ))}
          </section>
        )}

        <section data-reveal className="hairline-t pt-8">
          <p className="section-marker mb-6">Entry Points</p>
          <ul className="space-y-0">
            <li className="flex flex-wrap items-end justify-between gap-4 py-5 hairline-b">
              <div>
                <p className="text-kicker mb-2">CTDP</p>
                <p className="text-headline-zh text-2xl">节点森林</p>
                <p className="mt-2 text-sm text-ink-muted">执行、预约、触发与裁决。</p>
              </div>
              <Button href="/ctdp" variant="secondary" size="sm">
                打开画布
              </Button>
            </li>
            <li className="flex flex-wrap items-end justify-between gap-4 py-5 hairline-b last:border-b-0">
              <div>
                <p className="text-kicker mb-2">RSIP</p>
                <p className="text-headline-zh text-2xl">国策树</p>
                <p className="mt-2 text-sm text-ink-muted">活跃节点 {activePolicies} 个。</p>
              </div>
              <Button href="/rsip" variant="secondary" size="sm">
                管理国策
              </Button>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
