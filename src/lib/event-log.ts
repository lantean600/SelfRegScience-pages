import { prisma } from "@/lib/db";

export async function logEvent(
  userId: string,
  type: string,
  payload: Record<string, unknown> = {},
) {
  return prisma.eventLog.create({
    data: {
      userId,
      type,
      payload: JSON.stringify(payload),
    },
  });
}
