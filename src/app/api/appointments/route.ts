import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { createAppointment } from "@/lib/domain/aux-chain";
import { linkPolicyToCtdpNode } from "@/lib/domain/recommendations";

export async function GET() {
  try {
    const user = await requireUser();
    const appts = await prisma.appointment.findMany({
      where: { auxChain: { userId: user.id } },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      include: { auxChain: { include: { sacredSeat: true } } },
    });
    return jsonOk(appts);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      sacredSeatId: string;
      signalType: string;
      kind?: "primary" | "instant";
      parentId?: string;
      policyId?: string;
    }>(request);

    if (body.policyId) {
      const linked = await linkPolicyToCtdpNode(user.id, body.policyId);
      if (linked) return jsonOk(linked);
    }

    const appt = await createAppointment({
      userId: user.id,
      sacredSeatId: body.sacredSeatId,
      signalType: body.signalType,
      kind: body.kind,
      parentId: body.parentId,
    });

    if (body.kind === "primary" && !body.parentId) {
      const instant = await createAppointment({
        userId: user.id,
        sacredSeatId: body.sacredSeatId,
        signalType: body.signalType + "_instant",
        kind: "instant",
        parentId: appt.id,
        primaryBufferSeconds: user.primaryAppointmentSec,
      });
      return jsonOk({ primary: appt, instant });
    }

    return jsonOk(appt);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
