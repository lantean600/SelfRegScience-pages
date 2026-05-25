import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { getOrCreateAuxChain } from "@/lib/domain/aux-chain";
import { getOrCreateNetwork } from "@/lib/domain/ctdp-node";

export async function GET() {
  try {
    const user = await requireUser();
    const seats = await prisma.sacredSeat.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(seats);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      name: string;
      triggerPayload: string;
      triggerType?: string;
      minFocusMinutes?: number;
    }>(request);

    const seat = await prisma.sacredSeat.create({
      data: {
        userId: user.id,
        name: body.name,
        triggerPayload: body.triggerPayload,
        triggerType: body.triggerType ?? "custom",
        minFocusMinutes: body.minFocusMinutes ?? user.defaultFocusMinutes,
      },
    });

    await getOrCreateAuxChain(user.id, seat.id);
    const network = await getOrCreateNetwork(user.id);
    if (!network.defaultSacredSeatId) {
      await prisma.ctdpNetwork.update({
        where: { id: network.id },
        data: { defaultSacredSeatId: seat.id },
      });
    }

    return jsonOk(seat);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
