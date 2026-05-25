import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import {
  getOrCreateActiveTree,
  addPolicyNode,
  recordDailyPolicy,
  resolvePolicyViolation,
  dailySettlement,
} from "@/lib/domain/policy-tree";

export async function GET() {
  try {
    const user = await requireUser();
    const tree = await getOrCreateActiveTree(user.id);
    const settlement = await dailySettlement(user.id, user.timezone);
    return jsonOk({ tree, settlement });
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      action: "add" | "daily" | "violate";
      policyId?: string;
      parentId?: string;
      groupId?: string;
      nodeId?: string;
      satisfied?: boolean;
      note?: string;
      behaviorKey?: string;
      verdict?: "break_chain" | "allow_permanently";
      description?: string;
    }>(request);

    if (body.action === "add" && body.policyId) {
      const node = await addPolicyNode({
        userId: user.id,
        policyId: body.policyId,
        parentId: body.parentId,
        groupId: body.groupId,
      });
      return jsonOk(node);
    }

    if (body.action === "daily" && body.nodeId) {
      const result = await recordDailyPolicy({
        userId: user.id,
        nodeId: body.nodeId,
        satisfied: body.satisfied ?? false,
        note: body.note,
      });
      return jsonOk(result);
    }

    if (
      body.action === "violate" &&
      body.nodeId &&
      body.behaviorKey &&
      body.verdict
    ) {
      const result = await resolvePolicyViolation({
        userId: user.id,
        nodeId: body.nodeId,
        behaviorKey: body.behaviorKey,
        verdict: body.verdict,
        description: body.description,
      });
      return jsonOk(result);
    }

    return jsonError("INVALID_ACTION");
  } catch (e) {
    if (e instanceof Error && e.message === "DAILY_ADD_LIMIT")
      return jsonError("每日最多添加一个国策节点", 400);
    if (e instanceof Error) return jsonError(e.message);
    return jsonError("UNAUTHORIZED", 401);
  }
}
