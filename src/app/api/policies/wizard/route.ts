import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { generatePolicyDraft } from "@/lib/domain/policy-wizard";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      steadyStateTarget: string;
      backtrackSteps: { description: string; tendencyGap?: number }[];
      interventionIndex: number;
      save?: boolean;
    }>(request);

    const draft = generatePolicyDraft(body);
    if (!body.save) return jsonOk({ draft });

    const policy = await prisma.policy.create({
      data: { userId: user.id, ...draft },
    });
    return jsonOk({ draft, policy });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return jsonError("UNAUTHORIZED", 401);
  }
}
