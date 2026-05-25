import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword } from "../src/lib/auth";
import { getDb } from "../src/lib/db";
import {
  createNode,
  armNodeExecution,
  triggerNodeExecution,
  completeNodeSession,
  judgeNode,
  abandonNodeExecution,
  handleMissedTriggerDeadline,
} from "../src/lib/domain/ctdp-node";

describe("ctdp-node lifecycle", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let userId: string;
  let seatId: string;

  beforeAll(async () => {
    db = await getDb();
    const user = await db.user.create({
      data: {
        email: `ctdp-${Date.now()}@test.com`,
        passwordHash: await hashPassword("test"),
      },
    });
    userId = user.id;
    const seat = await db.sacredSeat.create({
      data: { userId, name: "Hat", triggerPayload: "wear" },
    });
    seatId = seat.id;
    await db.ctdpNetwork.create({
      data: { userId, defaultSacredSeatId: seatId },
    });
  });

  it("arm → trigger → judge success", async () => {
    const node = await createNode({ userId, title: "Task A" });
    await armNodeExecution(userId, node.id);
    const executing = await triggerNodeExecution(userId, node.id);
    await completeNodeSession(userId, executing.activeSessionId!);
    const judged = await judgeNode({
      userId,
      nodeId: node.id,
      verdict: "success",
    });
    expect(judged.state).toBe("success");
    expect(judged.awaitingJudgment).toBe(false);
  });

  it("missed trigger → judge total_fail propagates", async () => {
    const a = await createNode({ userId, title: "Root" });
    const b = await createNode({ userId, title: "Child", refTargetId: a.id });
    await armNodeExecution(userId, b.id);
    const node = await db.ctdpNode.findUniqueOrThrow({ where: { id: b.id } });
    const apptId = node.pendingAppointmentId!;
    await handleMissedTriggerDeadline(userId, apptId);
    await judgeNode({ userId, nodeId: b.id, verdict: "total_fail" });
    const child = await db.ctdpNode.findUniqueOrThrow({ where: { id: b.id } });
    expect(child.state).toBe("failed");
    const root = await db.ctdpNode.findUniqueOrThrow({ where: { id: a.id } });
    expect(root.state).toBe("initial");
  });

  it("abandon marks failed", async () => {
    const node = await createNode({ userId, title: "Abandon me" });
    await armNodeExecution(userId, node.id);
    await triggerNodeExecution(userId, node.id);
    const after = await abandonNodeExecution(userId, node.id);
    expect(after.state).toBe("failed");
  });
});
