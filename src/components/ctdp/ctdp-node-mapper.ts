import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";

/** API / Prisma 序列化后的节点 → 画布行 */
export function mapApiNodeToRow(
  n: {
    id: string;
    title: string;
    state: string;
    refTargetId?: string | null;
    refCount?: number;
    judgmentRule?: string | null;
    layoutX?: number | null;
    layoutY?: number | null;
    pendingAppointmentId?: string | null;
    activeSessionId?: string | null;
    awaitingJudgment?: boolean;
    judgmentReason?: string | null;
    appointments?: { id: string; deadlineAt: string | Date; status: string }[];
  },
): CtdpNodeRow {
  return {
    id: n.id,
    title: n.title,
    state: n.state,
    refTargetId: n.refTargetId ?? null,
    refCount: n.refCount ?? 0,
    judgmentRule: n.judgmentRule ?? null,
    layoutX: n.layoutX ?? null,
    layoutY: n.layoutY ?? null,
    pendingAppointmentId: n.pendingAppointmentId ?? null,
    activeSessionId: n.activeSessionId ?? null,
    awaitingJudgment: n.awaitingJudgment ?? false,
    judgmentReason: n.judgmentReason ?? null,
    appointments: (n.appointments ?? []).map((a) => ({
      id: a.id,
      deadlineAt:
        typeof a.deadlineAt === "string" ? a.deadlineAt : a.deadlineAt.toISOString(),
      status: a.status,
    })),
  };
}

export function mapSnapshotNodes(
  nodes: Parameters<typeof mapApiNodeToRow>[0][],
): CtdpNodeRow[] {
  return nodes.map(mapApiNodeToRow);
}
