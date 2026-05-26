import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CtdpClient } from "@/components/CtdpClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getNetworkSnapshot, processCtdpOverdueAppointments } from "@/lib/domain/ctdp-node";

export default async function CtdpPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const prisma = await getDb();

  await processCtdpOverdueAppointments(user.id);

  const snap = await getNetworkSnapshot(user.id);
  const seats = await prisma.sacredSeat.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const nodes = snap.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    state: n.state,
    refTargetId: n.refTargetId,
    refCount: n.refCount,
    judgmentRule: n.judgmentRule,
    layoutX: n.layoutX,
    layoutY: n.layoutY,
    pendingAppointmentId: n.pendingAppointmentId,
    activeSessionId: n.activeSessionId,
    awaitingJudgment: n.awaitingJudgment,
    judgmentReason: n.judgmentReason,
    appointments: n.appointments.map((a) => ({
      id: a.id,
      deadlineAt: a.deadlineAt.toISOString(),
      status: a.status,
    })),
    activeSession: n.activeSession
      ? {
          startedAt: n.activeSession.startedAt.toISOString(),
          targetMinutes: n.activeSession.targetMinutes,
        }
      : null,
  }));

  return (
    <>
      <PageHeader
        kicker="Chained Time-Delay Protocol"
        title="CTDP"
        description="任务节点森林、引用属性 refCount、网络完整度，以及从预约到裁决的完整执行链。"
      />
      <CtdpClient
        nodes={JSON.parse(JSON.stringify(nodes))}
        completeness={snap.network.completeness}
        seats={JSON.parse(JSON.stringify(seats))}
        defaultAppointmentMin={user.defaultAppointmentMin}
        defaultFocusMinutes={user.defaultFocusMinutes}
      />
    </>
  );
}
