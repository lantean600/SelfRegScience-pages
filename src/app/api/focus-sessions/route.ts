import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const sessions = await prisma.focusSession.findMany({
      where: { userId: user.id },
      orderBy: { triggeredAt: "desc" },
      take: 30,
      include: { sacredSeat: true },
    });
    return jsonOk(sessions);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
