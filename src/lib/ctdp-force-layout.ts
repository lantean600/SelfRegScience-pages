import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

export type ForceNodeDatum = SimulationNodeDatum & {
  id: string;
  radius: number;
};

export type ForceLinkDatum = SimulationLinkDatum<ForceNodeDatum>;

export type ForceLayoutOptions = {
  /** 用户可调 10–200，越大斥力越强，节点越分散 */
  chargeStrength: number;
};

const DRAG_ALPHA_TARGET = 0.5;
const SETTLE_ALPHA_TARGET = 0.12;
const SETTLE_ALPHA_STOP = 0.02;
const DRAG_CHARGE_DISTANCE_MAX = 5000;

type SavedDragForces = {
  centerStrength: number;
  linkStrength: number;
  chargeDistanceMax: number;
  chargeStrength: number;
};

const savedDragForces = new WeakMap<
  Simulation<ForceNodeDatum, ForceLinkDatum>,
  SavedDragForces
>();

function getLinkForce(sim: Simulation<ForceNodeDatum, ForceLinkDatum>) {
  return sim.force("link") as ReturnType<
    typeof forceLink<ForceNodeDatum, ForceLinkDatum>
  > | null;
}

function getChargeForce(sim: Simulation<ForceNodeDatum, ForceLinkDatum>) {
  return sim.force("charge") as ReturnType<
    typeof forceManyBody<ForceNodeDatum>
  > | null;
}

function getCenterForce(sim: Simulation<ForceNodeDatum, ForceLinkDatum>) {
  return sim.force("center") as ReturnType<
    typeof forceCenter<ForceNodeDatum>
  > | null;
}

/** 拖动时关闭向心、加强连线，避免邻居被中心力锁死 */
export function setDragForceMode(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  active: boolean,
) {
  const link = getLinkForce(sim);
  const charge = getChargeForce(sim);
  const center = getCenterForce(sim);
  if (!link || !charge || !center) return;

  if (active) {
    if (!savedDragForces.has(sim)) {
      const centerStr = center.strength();
      const linkStr = link.strength();
      const chargeStr = charge.strength();
      savedDragForces.set(sim, {
        centerStrength: typeof centerStr === "number" ? centerStr : 0.06,
        linkStrength: typeof linkStr === "number" ? linkStr : 0.28,
        chargeDistanceMax: charge.distanceMax() ?? 600,
        chargeStrength: typeof chargeStr === "number" ? chargeStr : -200,
      });
    }
    const saved = savedDragForces.get(sim)!;
    center.strength(0);
    link.strength(0.62);
    charge.distanceMax(DRAG_CHARGE_DISTANCE_MAX);
    charge.strength(saved.chargeStrength * 0.75);
    sim.velocityDecay(0.35);
  } else {
    const saved = savedDragForces.get(sim);
    if (saved) {
      center.strength(saved.centerStrength);
      link.strength(saved.linkStrength);
      charge.distanceMax(saved.chargeDistanceMax);
      charge.strength(saved.chargeStrength);
      savedDragForces.delete(sim);
    }
    sim.velocityDecay(0.4);
  }
}

function reheatSimForDrag(sim: Simulation<ForceNodeDatum, ForceLinkDatum>) {
  sim.alphaTarget(DRAG_ALPHA_TARGET);
  if (sim.alpha() < DRAG_ALPHA_TARGET * 0.75) {
    sim.alpha(DRAG_ALPHA_TARGET).restart();
  }
}

function buildForces(
  simNodes: ForceNodeDatum[],
  linkData: ForceLinkDatum[],
  width: number,
  height: number,
  opts: ForceLayoutOptions,
) {
  // 斥力：系数较温和，避免节点过度弹开
  const charge = -(opts.chargeStrength * 2.5 + simNodes.length * 4);
  const r = simNodes[0]?.radius ?? 22;

  return forceSimulation(simNodes)
    .force(
      "link",
      forceLink<ForceNodeDatum, ForceLinkDatum>(linkData)
        .id((d) => d.id)
        .distance(() => r * 2 + 100)
        .strength(0.28),
    )
    .force("charge", forceManyBody<ForceNodeDatum>().strength(charge).distanceMax(600))
    .force("center", forceCenter(width / 2, height / 2).strength(0.06))
    .force(
      "collide",
      forceCollide<ForceNodeDatum>((d) => d.radius + 14).strength(0.9),
    );
}

export function runForceToConvergence(params: {
  nodes: ForceNodeDatum[];
  links: { source: string; target: string }[];
  width: number;
  height: number;
  iterations?: number;
  forceOptions: ForceLayoutOptions;
}): {
  positions: Map<string, { x: number; y: number }>;
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>;
} {
  const { nodes, links, width, height, iterations = 350, forceOptions } = params;

  const simNodes: ForceNodeDatum[] = nodes.map((n) => ({ ...n }));
  const linkData = links.map((l) => ({
    source: l.source,
    target: l.target,
  })) as ForceLinkDatum[];

  const sim = buildForces(simNodes, linkData, width, height, forceOptions).stop();

  for (let i = 0; i < iterations; i++) {
    sim.tick();
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const n of simNodes) {
    if (n.x != null && n.y != null) positions.set(n.id, { x: n.x, y: n.y });
  }

  return { positions, sim };
}

function positionsFromSimNodes(
  simNodes: Iterable<ForceNodeDatum>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  for (const n of simNodes) {
    if (n.x != null && n.y != null) positions.set(n.id, { x: n.x, y: n.y });
  }
  return positions;
}

export function tickForceSimulation(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  iterations: number,
): Map<string, { x: number; y: number }> {
  sim.stop();
  for (let i = 0; i < iterations; i++) {
    sim.tick();
  }
  return positionsFromSimNodes(sim.nodes());
}

export function tickForceSimulationAsync(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  iterations: number,
  options?: {
    chunkSize?: number;
    onProgress?: (positions: Map<string, { x: number; y: number }>) => void;
  },
): Promise<Map<string, { x: number; y: number }>> {
  const chunkSize = options?.chunkSize ?? 8;
  sim.stop();
  let done = 0;

  return new Promise((resolve) => {
    const step = () => {
      const batch = Math.min(chunkSize, iterations - done);
      for (let i = 0; i < batch; i++) {
        sim.tick();
      }
      done += batch;
      const positions = positionsFromSimNodes(sim.nodes());
      options?.onProgress?.(positions);
      if (done >= iterations) {
        resolve(positions);
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

export function positionsFromSimulation(
  simNodes: ForceNodeDatum[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  for (const n of simNodes) {
    if (n.x != null && n.y != null) positions.set(n.id, { x: n.x, y: n.y });
  }
  return positions;
}

export type SimDriver = {
  start(): void;
  stop(): void;
  setAlphaTarget(target: number): void;
  setDragActive(active: boolean): void;
};

/** rAF 驱动 d3 simulation，拖动或 alpha 未耗尽时持续 tick */
export function createSimulationDriver(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  onTick: (positions: Map<string, { x: number; y: number }>) => void,
): SimDriver {
  let rafId: number | null = null;
  let dragActive = false;
  let halted = false;

  const loop = () => {
    rafId = null;
    if (halted) return;

    const alpha = sim.alpha();
    const shouldRun = dragActive || alpha > Math.max(sim.alphaMin(), SETTLE_ALPHA_STOP);

    if (shouldRun) {
      sim.tick();
      onTick(positionsFromSimNodes(sim.nodes()));
      rafId = requestAnimationFrame(loop);
    } else {
      sim.alphaTarget(0);
      sim.stop();
    }
  };

  return {
    start() {
      halted = false;
      if (rafId === null) {
        rafId = requestAnimationFrame(loop);
      }
    },
    stop() {
      halted = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      sim.alphaTarget(0);
      sim.stop();
    },
    setAlphaTarget(target: number) {
      sim.alphaTarget(target);
      if (target > 0 && sim.alpha() < target) {
        sim.alpha(target).restart();
      }
      this.start();
    },
    setDragActive(active: boolean) {
      dragActive = active;
      if (active) this.start();
    },
  };
}

export function syncSimPositionsFromRf(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  rfNodes: { id: string; x: number; y: number; radius: number }[],
) {
  for (const rf of rfNodes) {
    const datum = sim.nodes().find((d) => d.id === rf.id);
    if (!datum) continue;
    datum.x = rf.x + rf.radius;
    datum.y = rf.y + rf.radius;
    datum.vx = 0;
    datum.vy = 0;
  }
}

export function beginNodeDrag(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  driver: SimDriver,
  nodeId: string,
) {
  setDragForceMode(sim, true);
  const datum = sim.nodes().find((d) => d.id === nodeId);
  if (datum && datum.x != null && datum.y != null) {
    datum.fx = datum.x;
    datum.fy = datum.y;
    datum.vx = 0;
    datum.vy = 0;
  }
  driver.setDragActive(true);
  reheatSimForDrag(sim);
  driver.start();
}

export function moveDraggedNode(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  driver: SimDriver | null,
  nodeId: string,
  centerX: number,
  centerY: number,
) {
  const datum = sim.nodes().find((d) => d.id === nodeId);
  if (!datum) return;
  datum.fx = centerX;
  datum.fy = centerY;
  datum.vx = 0;
  datum.vy = 0;
  reheatSimForDrag(sim);
  driver?.start();
}

export function endNodeDrag(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  driver: SimDriver,
  nodeId: string,
) {
  const datum = sim.nodes().find((d) => d.id === nodeId);
  if (datum) {
    datum.fx = null;
    datum.fy = null;
  }
  setDragForceMode(sim, false);
  driver.setDragActive(false);
  driver.setAlphaTarget(SETTLE_ALPHA_TARGET);
}
