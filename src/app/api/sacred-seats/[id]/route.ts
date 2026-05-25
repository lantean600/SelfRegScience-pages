import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody<{
      name?: string;
      triggerPayload?: string;
      minFocusMinutes?: number;
      layoutX?: number;
      layoutY?: number;
    }>(request);

    const existing = await prisma.sacredSeat.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("SEAT_NOT_FOUND", 404);

    const seat = await prisma.sacredSeat.update({
      where: { id },
      data: body,
    });
    return jsonOk(seat);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
