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

function buildForces(
  simNodes: ForceNodeDatum[],
  linkData: ForceLinkDatum[],
  width: number,
  height: number,
  opts: ForceLayoutOptions,
) {
  // 斥力：节点越多、越强配置，越分散
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

/**
 * 同步运行力模拟到收敛，返回收敛后的位置 Map 和 Simulation 实例。
 * 返回的 sim 可复用于拖拽交互（加热 alpha 即可）。
 */
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

  // 保持原始对象引用，供后续拖拽复用
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

/** 分帧 tick，避免新建节点时主线程长任务卡顿 */
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

/** 为拖拽阶段在现有 sim 上启用 tick 回调并加热 */
export function heatSimForDrag(
  sim: Simulation<ForceNodeDatum, ForceLinkDatum>,
  onTick: (positions: Map<string, { x: number; y: number }>) => void,
) {
  sim.on("tick.drag", () => {
    const positions = new Map<string, { x: number; y: number }>();
    for (const n of sim.nodes()) {
      if (n.x != null && n.y != null) positions.set(n.id, { x: n.x, y: n.y });
    }
    onTick(positions);
  });
  sim.alphaTarget(0.35).restart();
}

export function coolSimAfterDrag(sim: Simulation<ForceNodeDatum, ForceLinkDatum>) {
  sim.alphaTarget(0);
  // alpha 衰减到 minAlpha 后 d3 自动停止
  window.setTimeout(() => {
    sim.on("tick.drag", null);
  }, 2000);
}
