import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import {
  createCompartmentFreeze,
  processUnfreeze,
} from "@/lib/domain/compartment-freeze";

export async function GET() {
  try {
    const user = await requireUser();
    const freezes = await prisma.compartmentFreeze.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(freezes);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      action?: "create" | "unfreeze";
      reason?: string;
      startAt?: string;
      endAt?: string;
      affectedNodeIds?: string[];
      freezeId?: string;
    }>(request);

    if (body.action === "unfreeze" && body.freezeId) {
      const results = await processUnfreeze(user.id, body.freezeId);
      return jsonOk(results);
    }

    const freeze = await createCompartmentFreeze({
      userId: user.id,
      reason: body.reason ?? "",
      startAt: new Date(body.startAt ?? Date.now()),
      endAt: new Date(body.endAt ?? Date.now()),
      affectedNodeIds: body.affectedNodeIds ?? [],
    });
    return jsonOk(freeze);
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return jsonError("UNAUTHORIZED", 401);
  }
}
