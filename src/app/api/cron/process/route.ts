import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { processOverdueAppointments } from "@/lib/domain/aux-chain";
import { dailySettlement } from "@/lib/domain/policy-tree";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const user = await requireUser();
    const overdue = await processOverdueAppointments(user.id);
    const settlement = await dailySettlement(user.id, user.timezone);

    const longSessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        status: "focusing",
        startedAt: { lt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      },
    });
    for (const s of longSessions) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "FOCUS_WATCHDOG",
          message: `专注会话 ${s.id} 已超过 3 小时，请确认状态`,
        },
      });
    }

    return jsonOk({ overdue, settlement, watchdog: longSessions.length });
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
