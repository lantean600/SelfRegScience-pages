import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ReviewClient } from "@/components/ReviewClient";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const prisma = await getDb();

  const [logs, collapses, wins, precedents] = await Promise.all([
    prisma.eventLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.collapseRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { node: { include: { policy: true } } },
    }),
    prisma.dailyWinLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.precedent.findMany({
      where: { userId: user.id },
      orderBy: { allowedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
      <PageHeader
        kicker="Review & Precedent"
        title="复盘"
        description="赢麻了、崩塌、判例与事件日志"
      />
      <ReviewClient
        logs={JSON.parse(JSON.stringify(logs))}
        collapses={JSON.parse(JSON.stringify(collapses))}
        wins={JSON.parse(JSON.stringify(wins))}
        precedents={JSON.parse(JSON.stringify(precedents))}
      />
    </>
  );
}
