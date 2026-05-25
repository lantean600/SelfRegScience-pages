import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import type { ScopeType } from "@/lib/constants";

export type ViolationVerdict = "break_chain" | "allow_permanently";

export async function findPrecedent(
  userId: string,
  scopeType: ScopeType,
  scopeId: string,
  behaviorKey: string,
) {
  return prisma.precedent.findUnique({
    where: {
      userId_scopeType_scopeId_behaviorKey: {
        userId,
        scopeType,
        scopeId,
        behaviorKey,
      },
    },
  });
}

export async function resolveViolation(params: {
  userId: string;
  scopeType: ScopeType;
  scopeId: string;
  behaviorKey: string;
  description?: string;
  verdict: ViolationVerdict;
}) {
  const existing = await findPrecedent(
    params.userId,
    params.scopeType,
    params.scopeId,
    params.behaviorKey,
  );
  if (existing) {
    return { alreadyAllowed: true, precedent: existing };
  }

  if (params.verdict === "allow_permanently") {
    const precedent = await prisma.precedent.create({
      data: {
        userId: params.userId,
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        behaviorKey: params.behaviorKey,
        description: params.description,
      },
    });
    await logEvent(params.userId, "PRECEDENT_ALLOWED", {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      behaviorKey: params.behaviorKey,
    });
    return { alreadyAllowed: false, precedent, breakRequired: false };
  }

  await logEvent(params.userId, "PRECEDENT_BREAK", {
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    behaviorKey: params.behaviorKey,
  });
  return { alreadyAllowed: false, precedent: null, breakRequired: true };
}

export function precedentConsequenceMessage(behaviorKey: string) {
  return `若选择「永久允许」，今后在相同作用域内遇到「${behaviorKey}」时，必须一律允许，不可再判违规断裂。`;
}
