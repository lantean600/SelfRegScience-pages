import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword } from "../src/lib/auth";
import { getDb } from "../src/lib/db";
import {
  updateNodeLayout,
  moveNode,
  extinguishSubtree,
} from "../src/lib/domain/policy-tree";
import { todayInTimezone } from "../src/lib/date-utils";

describe("Visual API / layout domain", () => {
  let prisma: Awaited<ReturnType<typeof getDb>>;
  let userId: string;
  let nodeA: string;
  let nodeB: string;
  let treeId: string;

  beforeAll(async () => {
    prisma = await getDb();
    const user = await prisma.user.create({
      data: {
        email: `visual-${Date.now()}@example.com`,
        passwordHash: await hashPassword("test123"),
      },
    });
    userId = user.id;
    const today = todayInTimezone("Asia/Shanghai");

    const tree = await prisma.policyTree.create({
      data: { userId, slotName: `visual-${Date.now()}`, isActive: true },
    });
    treeId = tree.id;

    const p1 = await prisma.policy.create({
      data: { userId, title: "测试国策 A", type: "passive" },
    });
    const p2 = await prisma.policy.create({
      data: { userId, title: "测试国策 B", type: "active" },
    });

    const a = await prisma.policyTreeNode.create({
      data: {
        treeId,
        policyId: p1.id,
        position: 1,
        addedOnDate: today,
        status: "active",
      },
    });
    nodeA = a.id;

    const b = await prisma.policyTreeNode.create({
      data: {
        treeId,
        policyId: p2.id,
        parentId: nodeA,
        position: 2,
        addedOnDate: today,
        status: "active",
      },
    });
    nodeB = b.id;
  });

  it("updates node layout coordinates", async () => {
    const updated = await updateNodeLayout(userId, nodeA, 120.5, 340);
    expect(updated.layoutX).toBe(120.5);
    expect(updated.layoutY).toBe(340);
  });

  it("rejects move that creates cycle", async () => {
    await expect(moveNode(userId, nodeA, nodeB)).rejects.toThrow("CYCLE_DETECTED");
  });

  it("allows moving node to new parent (root)", async () => {
    const moved = await moveNode(userId, nodeB, null);
    expect(moved.parentId).toBeNull();
  });

  it("extinguish subtree marks nodes inactive", async () => {
    await moveNode(userId, nodeB, nodeA);
    const ids = await extinguishSubtree(userId, nodeA, "test_extinguish");
    expect(ids.length).toBeGreaterThanOrEqual(1);
    const active = await prisma.policyTreeNode.count({
      where: { treeId, status: "active", id: { in: ids } },
    });
    expect(active).toBe(0);
  });
});
