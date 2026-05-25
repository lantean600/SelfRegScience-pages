import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { addMinutes, addSeconds } from "@/lib/date-utils";
import { resolveViolation } from "@/lib/domain/precedent-engine";

export async function getOrCreateAuxChain(userId: string, sacredSeatId: string) {
  let chain = await prisma.auxChain.findUnique({
    where: { userId_sacredSeatId: { userId, sacredSeatId } },
    include: {
      appointments: {
        where: { status: "pending" },
        orderBy: { scheduledAt: "desc" },
        take: 5,
      },
    },
  });
  if (!chain) {
    chain = await prisma.auxChain.create({
      data: { userId, sacredSeatId },
      include: { appointments: true },
    });
  }
  return chain;
}

export async function createAppointment(params: {
  userId: string;
  sacredSeatId: string;
  signalType: string;
  appointmentMinutes?: number;
  kind?: "primary" | "instant";
  parentId?: string;
  primaryBufferSeconds?: number;
  ctdpNodeId?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  const aux = await getOrCreateAuxChain(params.userId, params.sacredSeatId);
  const now = new Date();
  const kind = params.kind ?? "primary";

  let deadline: Date;
  if (kind === "instant") {
    deadline = addMinutes(now, user?.instantMaxDelayMin ?? 5);
  } else if (params.parentId) {
    deadline = addSeconds(now, params.primaryBufferSeconds ?? 870);
  } else {
    deadline = addMinutes(now, params.appointmentMinutes ?? user?.defaultAppointmentMin ?? 15);
  }

  const appointment = await prisma.appointment.create({
    data: {
      auxChainId: aux.id,
      ctdpNodeId: params.ctdpNodeId,
      kind,
      parentId: params.parentId,
      signalType: params.signalType,
      scheduledAt: now,
      deadlineAt: deadline,
      status: "pending",
    },
  });

  await logEvent(params.userId, "APPOINTMENT_CREATED", {
    appointmentId: appointment.id,
    kind,
    deadlineAt: deadline.toISOString(),
  });

  return appointment;
}

export async function fulfillAppointment(
  userId: string,
  appointmentId: string,
) {
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    include: { auxChain: true },
  });
  if (!appt || appt.auxChain.userId !== userId) throw new Error("NOT_FOUND");

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "fulfilled" },
  });

  if (appt.kind === "primary" && !appt.parentId) {
    await prisma.auxChain.update({
      where: { id: appt.auxChainId },
      data: { currentStreak: { increment: 1 } },
    });
  }

  await logEvent(userId, "APPOINTMENT_FULFILLED", { appointmentId });
  return updated;
}

export async function handleAppointmentOverdue(params: {
  userId: string;
  appointmentId: string;
  behaviorKey: string;
  verdict: "break_chain" | "allow_permanently";
  description?: string;
}) {
  const appt = await prisma.appointment.findFirst({
    where: { id: params.appointmentId },
    include: { auxChain: true },
  });
  if (!appt || appt.auxChain.userId !== params.userId) throw new Error("NOT_FOUND");

  const result = await resolveViolation({
    userId: params.userId,
    scopeType: "AUX_CHAIN",
    scopeId: appt.auxChainId,
    behaviorKey: params.behaviorKey,
    description: params.description,
    verdict: params.verdict,
  });

  if (result.breakRequired) {
    await prisma.auxChain.update({
      where: { id: appt.auxChainId },
      data: { currentStreak: 0 },
    });
    await prisma.appointment.update({
      where: { id: params.appointmentId },
      data: { status: "failed" },
    });
  } else {
    await prisma.appointment.update({
      where: { id: params.appointmentId },
      data: { status: "precedent_allowed" },
    });
  }

  await logEvent(params.userId, "APPOINTMENT_OVERDUE_RESOLVED", {
    appointmentId: params.appointmentId,
    verdict: params.verdict,
  });

  return result;
}

export async function processOverdueAppointments(userId: string) {
  const { processCtdpOverdueAppointments } = await import("@/lib/domain/ctdp-node");
  return processCtdpOverdueAppointments(userId);
}
