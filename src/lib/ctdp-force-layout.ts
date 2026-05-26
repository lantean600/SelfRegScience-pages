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

const DRAG_ALPHA_TARGET = 0.45;
const SETTLE_ALPHA_TARGET = 0.12;
const SETTLE_ALPHA_STOP = 0.02;

function buildForces(
  simNodes: ForceNodeDatum[],
  linkData: ForceLinkDatum[],
  width: number,
  height: number,
  opts: ForceLayoutOptions,
) {
  const charge = -(opts.chargeStrength * 5 + simNodes.length * 8);
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
  const datum = sim.nodes().find((d) => d.id === nodeId);
  if (datum && datum.x != null && datum.y != null) {
    datum.fx = datum.x;
    datum.fy = datum.y;
  }
  driver.setDragActive(true);
  driver.setAlphaTarget(DRAG_ALPHA_TARGET);
}

export function moveDraggedNode(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  nodeId: string,
  centerX: number,
  centerY: number,
) {
  const datum = sim.nodes().find((d) => d.id === nodeId);
  if (!datum) return;
  datum.fx = centerX;
  datum.fy = centerY;
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
  driver.setDragActive(false);
  driver.setAlphaTarget(SETTLE_ALPHA_TARGET);
}
