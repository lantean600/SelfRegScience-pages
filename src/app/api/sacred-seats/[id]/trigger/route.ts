import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { fulfillAppointment } from "@/lib/domain/aux-chain";
import { triggerNodeExecution } from "@/lib/domain/ctdp-node";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      mode?: "standard" | "scout";
      appointmentId?: string;
      ctdpNodeId?: string;
    }>(request).catch(
      () => ({} as { mode?: "standard" | "scout"; appointmentId?: string; ctdpNodeId?: string }),
    );

    const seat = await prisma.sacredSeat.findFirst({
      where: { id, userId: user.id, isActive: true },
    });
    if (!seat) return jsonError("NOT_FOUND", 404);

    if (body.appointmentId) {
      await fulfillAppointment(user.id, body.appointmentId);
    }

    const pending = await prisma.appointment.findMany({
      where: {
        status: "pending",
        auxChain: { sacredSeatId: id, userId: user.id },
      },
    });
    for (const a of pending) {
      if (a.deadlineAt >= new Date()) {
        await fulfillAppointment(user.id, a.id);
      }
    }

    if (body.ctdpNodeId) {
      const node = await triggerNodeExecution(
        user.id,
        body.ctdpNodeId,
        body.mode ?? "standard",
      );
      return jsonOk(node);
    }

    return jsonError("CTDP_NODE_REQUIRED", 400);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return jsonError("UNAUTHORIZED", 401);
    throw e;
  }
}
