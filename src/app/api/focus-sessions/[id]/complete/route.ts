import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import {
  completeFocusSession,
  endScoutWithoutChain,
} from "@/lib/domain/focus-session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      action?: "complete" | "scout_end" | "extend";
    }>(request).catch(() => ({ action: "complete" as const }));

    if (body.action === "scout_end") {
      const s = await endScoutWithoutChain(user.id, id);
      return jsonOk(s);
    }

    const s = await completeFocusSession(user.id, id, {
      extendToStandard: body.action === "extend",
    });
    return jsonOk(s);
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return jsonError("UNAUTHORIZED", 401);
  }
}
