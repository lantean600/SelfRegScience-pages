import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { SCOUT_MINUTES } from "@/lib/constants";
import { completeNodeSession } from "@/lib/domain/ctdp-node";

export async function createFocusSession(params: {
  userId: string;
  sacredSeatId: string;
  mode?: "standard" | "scout";
  targetMinutes?: number;
  ctdpNodeId?: string;
}) {
  const seat = await prisma.sacredSeat.findFirst({
    where: { id: params.sacredSeatId, userId: params.userId, isActive: true },
  });
  if (!seat) throw new Error("SACRED_SEAT_NOT_FOUND");

  const mode = params.mode ?? "standard";
  const targetMinutes =
    params.targetMinutes ??
    (mode === "scout" ? SCOUT_MINUTES : seat.minFocusMinutes);

  const session = await prisma.focusSession.create({
    data: {
      userId: params.userId,
      sacredSeatId: params.sacredSeatId,
      ctdpNodeId: params.ctdpNodeId,
      mode,
      targetMinutes,
      status: "focusing",
      startedAt: new Date(),
    },
  });

  await logEvent(params.userId, "FOCUS_SESSION_STARTED", {
    sessionId: session.id,
    ctdpNodeId: params.ctdpNodeId,
    mode,
    targetMinutes,
  });

  return session;
}

export async function completeFocusSession(
  userId: string,
  sessionId: string,
  options?: { extendToStandard?: boolean },
) {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "focusing") throw new Error("INVALID_SESSION_STATE");

  if (session.mode === "scout" && options?.extendToStandard) {
    const seat = await prisma.sacredSeat.findUnique({
      where: { id: session.sacredSeatId },
    });
    const updated = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        mode: "standard",
        targetMinutes: seat?.minFocusMinutes ?? 60,
        startedAt: new Date(),
      },
    });
    await logEvent(userId, "FOCUS_SESSION_EXTENDED", { sessionId });
    return updated;
  }

  const completed = await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  if (session.ctdpNodeId) {
    await completeNodeSession(userId, sessionId);
  }

  await logEvent(userId, "FOCUS_SESSION_COMPLETED", {
    sessionId,
    mode: session.mode,
    ctdpNodeId: session.ctdpNodeId,
  });

  return completed;
}

export async function endScoutWithoutChain(userId: string, sessionId: string) {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId, mode: "scout" },
  });
  if (!session) throw new Error("SESSION_NOT_FOUND");

  const updated = await prisma.focusSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date() },
  });

  if (session.ctdpNodeId) {
    await completeNodeSession(userId, sessionId);
  }

  await logEvent(userId, "SCOUT_ENDED_NO_CHAIN", { sessionId });
  return updated;
}

export async function cancelFocusSession(userId: string, sessionId: string) {
  return prisma.focusSession.update({
    where: { id: sessionId },
    data: { status: "cancelled", completedAt: new Date() },
  });
}
