import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { getSurroundCityAdvice } from "@/lib/domain/recommendations";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get("policyId");
    if (!policyId) return jsonError("policyId required");
    const advice = await getSurroundCityAdvice(user.id, policyId);
    return jsonOk(advice);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
