import { describe, it, expect } from "vitest";
import {
  buildSnapshot,
  computeRefCount,
  recomputeAllRefCounts,
  computeCompleteness,
  propagateFailure,
  validateNewEdge,
  type CtdpGraphNode,
} from "../src/lib/domain/ctdp-graph";

function nodes(...list: Omit<CtdpGraphNode, "refCount">[]): ReturnType<typeof buildSnapshot> {
  const withCounts = list.map((n) => ({ ...n, refCount: 0 }));
  return recomputeAllRefCounts(buildSnapshot(withCounts));
}

describe("ctdp-graph", () => {
  it("computes refCount along single chain", () => {
    const g = nodes(
      { id: "a", state: "initial", refTargetId: "b" },
      { id: "b", state: "initial", refTargetId: "c" },
      { id: "c", state: "initial", refTargetId: null },
    );
    expect(g.get("a")!.refCount).toBe(2);
    expect(g.get("b")!.refCount).toBe(1);
    expect(g.get("c")!.refCount).toBe(0);
  });

  it("computes completeness", () => {
    const g = nodes(
      { id: "a", state: "success", refTargetId: "b" },
      { id: "b", state: "initial", refTargetId: null },
    );
    expect(computeCompleteness(g)).toBe(1);
  });

  it("propagates failure along out-edges", () => {
    const g = nodes(
      { id: "a", state: "failed", refTargetId: "b" },
      { id: "b", state: "success", refTargetId: "c" },
      { id: "c", state: "executing", refTargetId: null },
    );
    const after = propagateFailure("a", g);
    expect(after.get("b")!.state).toBe("failed");
    expect(after.get("c")!.state).toBe("failed");
  });

  it("does not change initial nodes on propagate", () => {
    const g = nodes(
      { id: "a", state: "failed", refTargetId: "b" },
      { id: "b", state: "initial", refTargetId: null },
    );
    const after = propagateFailure("a", g);
    expect(after.get("b")!.state).toBe("initial");
  });

  it("stops at firewall when in-degree >= 2", () => {
    const g = nodes(
      { id: "a", state: "failed", refTargetId: "hub" },
      { id: "x", state: "success", refTargetId: "hub" },
      { id: "hub", state: "success", refTargetId: "tail" },
      { id: "tail", state: "success", refTargetId: null },
    );
    const after = propagateFailure("a", g);
    expect(after.get("hub")!.state).toBe("failed");
    expect(after.get("tail")!.state).toBe("success");
  });

  it("rejects cycles on validateNewEdge", () => {
    const g = nodes(
      { id: "a", state: "initial", refTargetId: "b" },
      { id: "b", state: "initial", refTargetId: null },
    );
    expect(validateNewEdge("b", "a", g).ok).toBe(false);
  });
});
