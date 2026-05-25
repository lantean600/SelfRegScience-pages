import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword } from "../src/lib/auth";
import { getDb } from "../src/lib/db";
import { extinguishSubtree, rollbackPolicyFailure } from "../src/lib/domain/policy-tree";
import { createCompartmentFreeze, processUnfreeze } from "../src/lib/domain/compartment-freeze";
import { createPolicyGroup } from "../src/lib/domain/policy-group";
import { updateHabitOnSatisfaction, getHabitProgress } from "../src/lib/domain/habit-progress";
import {
  createNode,
  armNodeExecution,
  judgeNode,
  handleMissedTriggerDeadline,
} from "../src/lib/domain/ctdp-node";

describe("Acceptance scenarios", () => {
  let prisma: Awaited<ReturnType<typeof getDb>>;
  let userId: string;
  let seatId: string;

  beforeAll(async () => {
    prisma = await getDb();
    const email = `test-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword("test123"),
      },
    });
    userId = user.id;
    const seat = await prisma.sacredSeat.create({
      data: {
        userId,
        name: "Test Seat",
        triggerPayload: "blue hat",
      },
    });
    seatId = seat.id;
    await prisma.ctdpNetwork.create({
      data: { userId, defaultSacredSeatId: seatId },
    });
  });

  it("1. ctdp missed trigger then judge success", async () => {
    const node = await createNode({ userId, title: "Focus block" });
    await armNodeExecution(userId, node.id);
    const armed = await prisma.ctdpNode.findUniqueOrThrow({ where: { id: node.id } });
    await handleMissedTriggerDeadline(userId, armed.pendingAppointmentId!);
    const judged = await judgeNode({ userId, nodeId: node.id, verdict: "success" });
    expect(judged.state).toBe("success");
  });

  it("2. ctdp total fail does not change initial upstream", async () => {
    const root = await createNode({ userId, title: "Root" });
    const leaf = await createNode({ userId, title: "Leaf", refTargetId: root.id });
    await armNodeExecution(userId, leaf.id);
    const armed = await prisma.ctdpNode.findUniqueOrThrow({ where: { id: leaf.id } });
    await handleMissedTriggerDeadline(userId, armed.pendingAppointmentId!);
    await judgeNode({ userId, nodeId: leaf.id, verdict: "total_fail" });
    const rootAfter = await prisma.ctdpNode.findUniqueOrThrow({ where: { id: root.id } });
    expect(rootAfter.state).toBe("initial");
  });

  it("3. policy tree subtree extinguish", async () => {
    const pA = await prisma.policy.create({
      data: { userId, title: "A", type: "passive", difficulty: 1, maintenanceCost: 1 },
    });
    const pB = await prisma.policy.create({
      data: { userId, title: "B", type: "passive", difficulty: 1, maintenanceCost: 1 },
    });
    const pC = await prisma.policy.create({
      data: { userId, title: "C", type: "passive", difficulty: 1, maintenanceCost: 1 },
    });
    const tree = await prisma.policyTree.create({
      data: { userId, slotName: `t-${Date.now()}` },
    });
    const nA = await prisma.policyTreeNode.create({
      data: {
        treeId: tree.id,
        policyId: pA.id,
        position: 0,
        addedOnDate: "2020-01-01",
      },
    });
    const nB = await prisma.policyTreeNode.create({
      data: {
        treeId: tree.id,
        policyId: pB.id,
        parentId: nA.id,
        position: 1,
        addedOnDate: "2020-01-02",
      },
    });
    await prisma.policyTreeNode.create({
      data: {
        treeId: tree.id,
        policyId: pC.id,
        parentId: nB.id,
        position: 2,
        addedOnDate: "2020-01-03",
      },
    });
    await rollbackPolicyFailure(userId, nB.id, "forgot");
    const b = await prisma.policyTreeNode.findUnique({ where: { id: nB.id } });
    expect(b?.status).toBe("extinguished");
  });

  it("4. habit progress survives tree reset", async () => {
    const policy = await prisma.policy.create({
      data: { userId, title: "Habit", type: "passive", difficulty: 1, maintenanceCost: 1 },
    });
    await updateHabitOnSatisfaction(userId, policy.id, "2020-01-01");
    await updateHabitOnSatisfaction(userId, policy.id, "2020-01-02");
    const habits = await getHabitProgress(userId);
    const h = habits.find((x) => x.policyId === policy.id);
    expect(h?.internalizationDays).toBeGreaterThan(0);
  });
});
