"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { isPendingCtdpId } from "@/components/ctdp/ctdp-create-anchor";
import {
  isCtdpDragging,
  markCtdpPendingRelayout,
  setCtdpDragging,
} from "@/lib/ctdp-drag-state";
import {
  beginNodeDrag,
  createSimulationDriver,
  endNodeDrag,
  moveDraggedNode,
  runForceToConvergence,
  syncSimPositionsFromRf,
  tickForceSimulationAsync,
  type ForceLayoutOptions,
  type ForceNodeDatum,
  type SimDriver,
} from "@/lib/ctdp-force-layout";

const CANVAS_W = 1000;
const CANVAS_H = 700;

export type CtdpForceLayoutMeta = {
  radii: Map<string, number>;
  links: { source: string; target: string }[];
  forceOptions: ForceLayoutOptions;
};

function applyPositions(
  setNodes: ReturnType<typeof useReactFlow>["setNodes"],
  positions: Map<string, { x: number; y: number }>,
  radii: Map<string, number>,
  defaultR: number,
  onlyIds?: Set<string>,
) {
  setNodes((prev) =>
    prev.map((n) => {
      if (onlyIds && !onlyIds.has(n.id)) return n;
      const p = positions.get(n.id);
      if (!p) return n;
      const radius = radii.get(n.id) ?? defaultR;
      return { ...n, position: { x: p.x - radius, y: p.y - radius } };
    }),
  );
}

function buildSimNodes(
  rfNodes: Node[],
  radii: Map<string, number>,
  defaultR: number,
  fixedIds: Set<string>,
  newIds: Set<string>,
) {
  return rfNodes.map((n, i) => {
    const radius = radii.get(n.id) ?? defaultR;
    const isNew = newIds.has(n.id);
    let cx: number;
    let cy: number;

    if (isNew) {
      const angle = (i / Math.max(rfNodes.length, 1)) * Math.PI * 2;
      const spread = Math.max(100, newIds.size * 28);
      cx = CANVAS_W / 2 + Math.cos(angle) * spread + (Math.random() - 0.5) * 24;
      cy = CANVAS_H / 2 + Math.sin(angle) * spread + (Math.random() - 0.5) * 24;
    } else {
      cx = n.position.x + radius;
      cy = n.position.y + radius;
    }

    const datum: ForceNodeDatum = { id: n.id, x: cx, y: cy, vx: 0, vy: 0, radius };
    if (fixedIds.has(n.id) && !isNew) {
      datum.fx = cx;
      datum.fy = cy;
    }
    return datum;
  });
}

function releaseFixed(simNodes: ForceNodeDatum[]) {
  for (const d of simNodes) {
    d.fx = null;
    d.fy = null;
  }
}

export function CtdpForceController({
  structureKey,
  settingsKey,
  layoutMeta,
}: {
  structureKey: string;
  settingsKey: string;
  layoutMeta: CtdpForceLayoutMeta;
}) {
  const { getNodes, setNodes } = useReactFlow();
  const simRef = useRef<ReturnType<typeof runForceToConvergence>["sim"] | null>(null);
  const driverRef = useRef<SimDriver | null>(null);
  const pinnedIdRef = useRef<string | null>(null);
  const metaRef = useRef(layoutMeta);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const prevStructureRef = useRef("");
  const prevSettingsRef = useRef("");
  const layoutGenRef = useRef(0);
  const mountedRef = useRef(false);
  const [relayoutToken, setRelayoutToken] = useState(0);

  metaRef.current = layoutMeta;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      driverRef.current?.stop();
      driverRef.current = null;
      simRef.current?.stop();
      simRef.current = null;
      setCtdpDragging(false);
    };
  }, []);

  const defaultRadius = useCallback(() => {
    return metaRef.current.radii.values().next().value ?? 22;
  }, []);

  const onDriverTick = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      if (!mountedRef.current) return;
      const pinned = pinnedIdRef.current;
      const { radii } = metaRef.current;
      const defaultR = defaultRadius();

      if (pinned) {
        const neighborIds = new Set(
          [...positions.keys()].filter((id) => id !== pinned),
        );
        if (neighborIds.size === 0) return;
        applyPositions(setNodes, positions, radii, defaultR, neighborIds);
        return;
      }

      applyPositions(setNodes, positions, radii, defaultR);
    },
    [setNodes, defaultRadius],
  );

  const attachDriver = useCallback(
    (sim: NonNullable<typeof simRef.current>) => {
      driverRef.current?.stop();
      driverRef.current = createSimulationDriver(sim, onDriverTick);
    },
    [onDriverTick],
  );

  const safeApplyPositions = useCallback(
    (
      positions: Map<string, { x: number; y: number }>,
      radii: Map<string, number>,
      defaultR: number,
      onlyIds?: Set<string>,
    ) => {
      if (!mountedRef.current) return;
      applyPositions(setNodes, positions, radii, defaultR, onlyIds);
    },
    [setNodes],
  );

  const bootstrapSim = useCallback(() => {
    const rfNodes = getNodes();
    if (rfNodes.length === 0) return null;

    const { radii, links, forceOptions } = metaRef.current;
    const defaultR = defaultRadius();
    const simNodes = buildSimNodes(rfNodes, radii, defaultR, new Set(), new Set());
    const { sim } = runForceToConvergence({
      nodes: simNodes,
      links,
      width: CANVAS_W,
      height: CANVAS_H,
      forceOptions,
      iterations: 0,
    });
    releaseFixed(sim.nodes());
    simRef.current = sim;
    attachDriver(sim);
    return sim;
  }, [getNodes, attachDriver, defaultRadius]);

  useEffect(() => {
    const onPendingRelayout = () => {
      setRelayoutToken((t) => t + 1);
    };
    window.addEventListener("ctdp-force-pending-relayout", onPendingRelayout);
    return () => window.removeEventListener("ctdp-force-pending-relayout", onPendingRelayout);
  }, []);

  useEffect(() => {
    if (isCtdpDragging()) {
      markCtdpPendingRelayout();
      return;
    }

    const gen = ++layoutGenRef.current;
    let cancelled = false;

    const runLayout = async () => {
      const rfNodes = getNodes();
      if (rfNodes.length === 0) {
        prevIdsRef.current = new Set();
        driverRef.current?.stop();
        driverRef.current = null;
        simRef.current?.stop();
        simRef.current = null;
        return;
      }

      const { radii, links, forceOptions } = metaRef.current;
      const defaultR = defaultRadius();
      const currentIds = new Set(rfNodes.map((n) => n.id));
      const prevIds = prevIdsRef.current;

      const added = [...currentIds].filter((id) => !prevIds.has(id));
      const removed = [...prevIds].filter((id) => !currentIds.has(id));
      const isFirstLayout = prevIds.size === 0;
      const onlyAdditions = added.length > 0 && removed.length === 0;
      const structureChanged =
        prevStructureRef.current !== "" && structureKey !== prevStructureRef.current;
      const settingsChanged =
        prevSettingsRef.current !== "" && settingsKey !== prevSettingsRef.current;

      driverRef.current?.stop();
      driverRef.current = null;
      simRef.current?.stop();
      simRef.current = null;

      const isStale = () =>
        cancelled || layoutGenRef.current !== gen || !mountedRef.current;

      const pendingSwap =
        removed.length > 0 &&
        added.length === removed.length &&
        removed.every((id) => isPendingCtdpId(id));

      if (pendingSwap) {
        prevIdsRef.current = currentIds;
        prevStructureRef.current = structureKey;
        prevSettingsRef.current = settingsKey;
        return;
      }

      if (isFirstLayout) {
        const simNodes = buildSimNodes(rfNodes, radii, defaultR, new Set(), new Set(currentIds));
        const { positions, sim } = runForceToConvergence({
          nodes: simNodes,
          links,
          width: CANVAS_W,
          height: CANVAS_H,
          forceOptions,
          iterations: 120,
        });
        if (isStale()) return;
        safeApplyPositions(positions, radii, defaultR);
        simRef.current = sim;
        attachDriver(sim);
      } else if (onlyAdditions && !settingsChanged) {
        const newIdSet = new Set(added);
        const fixedIds = new Set([...currentIds].filter((id) => !newIdSet.has(id)));
        const simNodes = buildSimNodes(rfNodes, radii, defaultR, fixedIds, newIdSet);
        const { sim } = runForceToConvergence({
          nodes: simNodes,
          links,
          width: CANVAS_W,
          height: CANVAS_H,
          forceOptions,
          iterations: 0,
        });
        releaseFixed(sim.nodes());
        await tickForceSimulationAsync(sim, 28, {
          chunkSize: 7,
          onProgress: (positions) => {
            if (isStale()) return;
            safeApplyPositions(positions, radii, defaultR, newIdSet);
          },
        });
        if (isStale()) return;
        simRef.current = sim;
        attachDriver(sim);
      } else if (removed.length > 0 && added.length === 0 && !settingsChanged) {
        const fixedIds = new Set(currentIds);
        const simNodes = buildSimNodes(rfNodes, radii, defaultR, fixedIds, new Set());
        const { sim } = runForceToConvergence({
          nodes: simNodes,
          links,
          width: CANVAS_W,
          height: CANVAS_H,
          forceOptions,
          iterations: 0,
        });
        releaseFixed(sim.nodes());
        await tickForceSimulationAsync(sim, 24, { chunkSize: 8 });
        if (isStale()) return;
        simRef.current = sim;
        attachDriver(sim);
      } else if (structureChanged && added.length === 0 && removed.length === 0) {
        const simNodes = buildSimNodes(rfNodes, radii, defaultR, new Set(), new Set());
        const { sim } = runForceToConvergence({
          nodes: simNodes,
          links,
          width: CANVAS_W,
          height: CANVAS_H,
          forceOptions,
          iterations: 0,
        });
        const positions = await tickForceSimulationAsync(sim, 48, {
          chunkSize: 8,
          onProgress: (pos) => {
            if (isStale()) return;
            safeApplyPositions(pos, radii, defaultR);
          },
        });
        if (isStale()) return;
        safeApplyPositions(positions, radii, defaultR);
        simRef.current = sim;
        attachDriver(sim);
      } else if (settingsChanged && added.length === 0 && removed.length === 0) {
        const fixedIds = new Set(currentIds);
        const simNodes = buildSimNodes(rfNodes, radii, defaultR, fixedIds, new Set());
        const { sim } = runForceToConvergence({
          nodes: simNodes,
          links,
          width: CANVAS_W,
          height: CANVAS_H,
          forceOptions,
          iterations: 0,
        });
        releaseFixed(sim.nodes());
        await tickForceSimulationAsync(sim, 32, { chunkSize: 8 });
        if (isStale()) return;
        simRef.current = sim;
        attachDriver(sim);
      } else {
        const hasPosition = (n: Node) =>
          prevIds.has(n.id) &&
          (Math.abs(n.position.x) > 1 || Math.abs(n.position.y) > 1);
        const fixedIds = new Set(rfNodes.filter(hasPosition).map((n) => n.id));
        const newIdSet = new Set(added);
        const simNodes = buildSimNodes(rfNodes, radii, defaultR, fixedIds, newIdSet);
        const iterCount = added.length > 0 ? 48 : 80;
        const { sim } = runForceToConvergence({
          nodes: simNodes,
          links,
          width: CANVAS_W,
          height: CANVAS_H,
          forceOptions,
          iterations: 0,
        });
        const positions = await tickForceSimulationAsync(sim, iterCount, {
          chunkSize: 10,
          onProgress: (pos) => {
            if (isStale()) return;
            safeApplyPositions(
              pos,
              radii,
              defaultR,
              added.length > 0 ? newIdSet : undefined,
            );
          },
        });
        if (isStale()) return;
        safeApplyPositions(positions, radii, defaultR);
        simRef.current = sim;
        attachDriver(sim);
      }

      prevIdsRef.current = currentIds;
      prevStructureRef.current = structureKey;
      prevSettingsRef.current = settingsKey;
    };

    void runLayout();

    return () => {
      cancelled = true;
    };
  }, [
    structureKey,
    settingsKey,
    relayoutToken,
    getNodes,
    setNodes,
    safeApplyPositions,
    attachDriver,
    defaultRadius,
  ]);

  useEffect(() => {
    function onDragStart(e: Event) {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      setCtdpDragging(true);
      pinnedIdRef.current = id;

      let sim = simRef.current;
      if (!sim) {
        sim = bootstrapSim();
      }
      if (!sim) return;

      if (!driverRef.current) {
        attachDriver(sim);
      }

      const rfNodes = getNodes();
      const { radii } = metaRef.current;
      const defaultR = defaultRadius();
      syncSimPositionsFromRf(
        sim,
        rfNodes.map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
          radius: radii.get(n.id) ?? defaultR,
        })),
      );

      const driver = driverRef.current;
      if (driver) beginNodeDrag(sim, driver, id);
    }

    function onDrag(e: Event) {
      const { id, x, y } = (e as CustomEvent<{ id: string; x: number; y: number }>).detail;
      const sim = simRef.current;
      if (!sim) return;
      const radius = metaRef.current.radii.get(id) ?? defaultRadius();
      moveDraggedNode(sim, driverRef.current, id, x + radius, y + radius);
    }

    function onDragStop(e: Event) {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      const sim = simRef.current;
      const driver = driverRef.current;
      if (sim && driver) {
        endNodeDrag(sim, driver, id);
      }
      pinnedIdRef.current = null;
      setCtdpDragging(false);
    }

    window.addEventListener("ctdp-force-drag-start", onDragStart);
    window.addEventListener("ctdp-force-drag", onDrag);
    window.addEventListener("ctdp-force-drag-stop", onDragStop);
    return () => {
      window.removeEventListener("ctdp-force-drag-start", onDragStart);
      window.removeEventListener("ctdp-force-drag", onDrag);
      window.removeEventListener("ctdp-force-drag-stop", onDragStop);
    };
  }, [getNodes, bootstrapSim, attachDriver, defaultRadius]);

  return null;
}

export function emitForceDrag(phase: "start" | "move" | "stop", node: Node) {
  const type =
    phase === "start"
      ? "ctdp-force-drag-start"
      : phase === "move"
        ? "ctdp-force-drag"
        : "ctdp-force-drag-stop";
  const detail =
    phase === "move"
      ? { id: node.id, x: node.position.x, y: node.position.y }
      : { id: node.id };
  window.dispatchEvent(new CustomEvent(type, { detail }));
}
