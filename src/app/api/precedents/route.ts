import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const scopeType = searchParams.get("scopeType");
    const scopeId = searchParams.get("scopeId");

    const precedents = await prisma.precedent.findMany({
      where: {
        userId: user.id,
        ...(scopeType ? { scopeType } : {}),
        ...(scopeId ? { scopeId } : {}),
      },
      orderBy: { allowedAt: "desc" },
    });
    return jsonOk(precedents);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
