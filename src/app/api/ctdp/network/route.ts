import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { getNetworkSnapshot } from "@/lib/domain/ctdp-node";

export async function GET() {
  try {
    const user = await requireUser();
    const snap = await getNetworkSnapshot(user.id);
    return jsonOk(snap);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
