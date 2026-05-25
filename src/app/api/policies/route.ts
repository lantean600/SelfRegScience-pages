import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const policies = await prisma.policy.findMany({
      where: { userId: user.id },
      include: { upgrades: true, habitProgress: true },
    });
    return jsonOk(policies);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      title: string;
      type: string;
      triggerJson?: string;
      constraintJson?: string;
      interventionNode?: string;
      steadyStateTarget?: string;
      isRelevant?: boolean;
      difficulty?: number;
      maintenanceCost?: number;
      isUpgradeable?: boolean;
      templateId?: string;
    }>(request);

    const policy = await prisma.policy.create({
      data: { userId: user.id, ...body },
    });

    if (body.isUpgradeable) {
      await prisma.policyUpgrade.create({
        data: { policyId: policy.id, level: 0 },
      });
    }

    return jsonOk(policy);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
