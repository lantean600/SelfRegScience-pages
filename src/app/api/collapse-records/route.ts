import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const records = await prisma.collapseRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { node: { include: { policy: true } } },
    });
    return jsonOk(records);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
