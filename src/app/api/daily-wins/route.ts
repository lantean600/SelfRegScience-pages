import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";
import { todayInTimezone } from "@/lib/date-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const logs = await prisma.dailyWinLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 30,
    });
    return jsonOk(logs);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      entries: { text: string; level?: string }[];
      dayName: string;
      winLevel: string;
    }>(request);
    const date = todayInTimezone(user.timezone);

    const log = await prisma.dailyWinLog.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: {
        userId: user.id,
        date,
        entriesJson: JSON.stringify(body.entries),
        dayName: body.dayName,
        winLevel: body.winLevel,
      },
      update: {
        entriesJson: JSON.stringify(body.entries),
        dayName: body.dayName,
        winLevel: body.winLevel,
      },
    });
    return jsonOk(log);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
