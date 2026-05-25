import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { createPolicyGroup } from "@/lib/domain/policy-group";

export async function GET() {
  try {
    const user = await requireUser();
    const groups = await prisma.policyGroup.findMany({
      where: { userId: user.id },
      include: { members: { include: { policy: true } } },
    });
    return jsonOk(groups);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      name: string;
      faultQuota: number;
      policyIds: string[];
    }>(request);
    const group = await createPolicyGroup({ userId: user.id, ...body });
    return jsonOk(group);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
