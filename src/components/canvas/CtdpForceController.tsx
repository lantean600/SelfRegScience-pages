"use client";

import { useEffect, useRef } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { isPendingCtdpId } from "@/components/ctdp/ctdp-create-anchor";
import {
  runForceToConvergence,
  tickForceSimulationAsync,
  heatSimForDrag,
  coolSimAfterDrag,
  type ForceLayoutOptions,
  type ForceNodeDatum,
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
  const metaRef = useRef(layoutMeta);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const prevStructureRef = useRef("");
  const prevSettingsRef = useRef("");
  const layoutGenRef = useRef(0);

  metaRef.current = layoutMeta;

  useEffect(() => {
    const gen = ++layoutGenRef.current;
    let cancelled = false;

    const runLayout = async () => {
      const rfNodes = getNodes();
      if (rfNodes.length === 0) {
        prevIdsRef.current = new Set();
        simRef.current?.stop();
        simRef.current = null;
        return;
      }

      const { radii, links, forceOptions } = metaRef.current;
      const defaultR = radii.values().next().value ?? 22;
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

      simRef.current?.stop();
      simRef.current = null;

      const isStale = () => cancelled || layoutGenRef.current !== gen;

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
        applyPositions(setNodes, positions, radii, defaultR);
        simRef.current = sim;
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
            applyPositions(setNodes, positions, radii, defaultR, newIdSet);
          },
        });
        if (isStale()) return;
        simRef.current = sim;
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
            applyPositions(setNodes, pos, radii, defaultR);
          },
        });
        if (isStale()) return;
        applyPositions(setNodes, positions, radii, defaultR);
        simRef.current = sim;
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
            applyPositions(setNodes, pos, radii, defaultR, added.length > 0 ? newIdSet : undefined);
          },
        });
        if (isStale()) return;
        applyPositions(setNodes, positions, radii, defaultR);
        simRef.current = sim;
      }

      prevIdsRef.current = currentIds;
      prevStructureRef.current = structureKey;
      prevSettingsRef.current = settingsKey;
    };

    void runLayout();

    return () => {
      cancelled = true;
      simRef.current?.stop();
      simRef.current = null;
    };
  }, [structureKey, settingsKey, getNodes, setNodes]);

  useEffect(() => {
    function onDragStart(e: Event) {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      const sim = simRef.current;
      if (!sim) return;

      const rfNodes = getNodes();
      for (const rfNode of rfNodes) {
        const datum = sim.nodes().find((d) => d.id === rfNode.id);
        if (datum) {
          const radius = metaRef.current.radii.get(rfNode.id) ?? 22;
          datum.x = rfNode.position.x + radius;
          datum.y = rfNode.position.y + radius;
          datum.vx = 0;
          datum.vy = 0;
        }
      }

      const datum = sim.nodes().find((d) => d.id === id);
      if (datum) {
        datum.fx = datum.x;
        datum.fy = datum.y;
      }

      heatSimForDrag(sim, (positions) => {
        applyPositions(
          setNodes,
          positions,
          metaRef.current.radii,
          metaRef.current.radii.values().next().value ?? 22,
        );
      });
    }

    function onDrag(e: Event) {
      const { id, x, y } = (e as CustomEvent<{ id: string; x: number; y: number }>).detail;
      const sim = simRef.current;
      if (!sim) return;
      const datum = sim.nodes().find((d) => d.id === id);
      if (datum) {
        const radius = metaRef.current.radii.get(id) ?? 22;
        datum.fx = x + radius;
        datum.fy = y + radius;
      }
    }

    function onDragStop(e: Event) {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      const sim = simRef.current;
      if (!sim) return;
      const datum = sim.nodes().find((d) => d.id === id);
      if (datum) {
        datum.fx = null;
        datum.fy = null;
      }
      coolSimAfterDrag(sim);
    }

    window.addEventListener("ctdp-force-drag-start", onDragStart);
    window.addEventListener("ctdp-force-drag", onDrag);
    window.addEventListener("ctdp-force-drag-stop", onDragStop);
    return () => {
      window.removeEventListener("ctdp-force-drag-start", onDragStart);
      window.removeEventListener("ctdp-force-drag", onDrag);
      window.removeEventListener("ctdp-force-drag-stop", onDragStop);
    };
  }, [getNodes, setNodes]);

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
