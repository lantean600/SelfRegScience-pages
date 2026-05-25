import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireUser();
    const templates = await prisma.policyTemplate.findMany({
      orderBy: { slug: "asc" },
    });
    return jsonOk(templates);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{ templateId: string }>(request);
    const template = await prisma.policyTemplate.findUnique({
      where: { id: body.templateId },
    });
    if (!template) return jsonError("NOT_FOUND", 404);

    const policy = await prisma.policy.create({
      data: {
        userId: user.id,
        templateId: template.id,
        title: template.title,
        type: template.type,
        triggerJson: template.triggerJson,
        constraintJson: template.constraintJson,
        interventionNode: template.interventionNode,
        steadyStateTarget: template.steadyStateTarget,
        isRelevant: true,
        difficulty: template.difficulty,
        maintenanceCost: template.maintenanceCost,
        isUpgradeable: template.isUpgradeable,
      },
    });

    if (template.isUpgradeable) {
      await prisma.policyUpgrade.create({ data: { policyId: policy.id } });
    }

    return jsonOk(policy);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
