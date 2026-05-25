import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { upgradePolicy } from "@/lib/domain/policy-upgrade";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{ success: boolean }>(request);
    const result = await upgradePolicy(user.id, id, body.success ?? true);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return jsonError("UNAUTHORIZED", 401);
  }
}
