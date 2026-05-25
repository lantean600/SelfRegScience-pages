import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { armNodeExecution } from "@/lib/domain/ctdp-node";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const node = await armNodeExecution(user.id, id);
    return jsonOk(node);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("UNAUTHORIZED", 401);
    }
    return jsonError(e instanceof Error ? e.message : "BAD_REQUEST", 400);
  }
}
