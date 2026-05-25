import { prisma } from "@/lib/db";

export function effectiveMaintenanceCost(
  base: number,
  internalizationDays: number,
) {
  return Math.max(1, base - Math.floor(internalizationDays / 7));
}

export async function updateHabitOnSatisfaction(
  userId: string,
  policyId: string,
  date: string,
) {
  const existing = await prisma.habitProgress.findUnique({
    where: { policyId },
  });

  if (!existing) {
    return prisma.habitProgress.create({
      data: {
        userId,
        policyId,
        internalizationDays: 1,
        lifetimeDays: 1,
        lastSatisfiedDate: date,
      },
    });
  }

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const consecutive =
    existing.lastSatisfiedDate === yStr || existing.lastSatisfiedDate === date
      ? existing.internalizationDays + 1
      : 1;

  return prisma.habitProgress.update({
    where: { policyId },
    data: {
      internalizationDays: consecutive,
      lifetimeDays: existing.lifetimeDays + 1,
      lastSatisfiedDate: date,
    },
  });
}

export async function getHabitProgress(userId: string) {
  return prisma.habitProgress.findMany({
    where: { userId },
    include: { policy: true },
  });
}
