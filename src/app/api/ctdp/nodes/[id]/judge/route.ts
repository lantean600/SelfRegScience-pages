import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { judgeNode, type JudgeVerdict } from "@/lib/domain/ctdp-node";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      verdict: JudgeVerdict;
      ruleText?: string;
      behaviorKey?: string;
    }>(request);
    const node = await judgeNode({
      userId: user.id,
      nodeId: id,
      verdict: body.verdict,
      ruleText: body.ruleText,
      behaviorKey: body.behaviorKey,
    });
    return jsonOk(node);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("UNAUTHORIZED", 401);
    }
    return jsonError(e instanceof Error ? e.message : "BAD_REQUEST", 400);
  }
}
