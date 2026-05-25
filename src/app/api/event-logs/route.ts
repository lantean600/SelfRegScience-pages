import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const logs = await prisma.eventLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk(logs);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
