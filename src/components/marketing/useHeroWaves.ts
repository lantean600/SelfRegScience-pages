"use client";

import { useEffect, useRef } from "react";
import { Noise } from "@/lib/motion/noise";
import { INTRO_EVENT } from "@/components/motion/SiteIntro";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

type WavePoint = {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: { x: number; y: number; vx: number; vy: number };
};

export type HeroWavesOptions = {
  interactiveMode?: "afterIntro" | "immediate";
  /** smoothing for wave deformation anchor */
  waveSmoothing?: number;
};

export function useHeroWaves(
  containerRef: React.RefObject<HTMLElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  options: HeroWavesOptions = {},
) {
  const { interactiveMode = "afterIntro", waveSmoothing = 0.1 } = options;

  const linesRef = useRef<WavePoint[][]>([]);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const noiseRef = useRef<Noise | null>(null);
  const rafRef = useRef<number | null>(null);
  const interactiveRef = useRef(false);
  const pausedRef = useRef(true);
  const boundingRef = useRef({ left: 0, top: 0, width: 0, height: 0 });

  const mouseRef = useRef({
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const reduced = prefersReducedMotion();
    noiseRef.current = new Noise(Math.random());

    function setSize() {
      const rect = container!.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      boundingRef.current = {
        left: rect.left,
        top: rect.top,
        width,
        height,
      };
      svg!.setAttribute("width", String(width));
      svg!.setAttribute("height", String(height));
      svg!.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg!.setAttribute("preserveAspectRatio", "none");
    }

    function setLines() {
      const { width, height } = boundingRef.current;
      const xGap = Math.max(8, Math.min(11, width / 100));
      const yGap = Math.max(14, Math.min(22, height / 22));
      const hPad = Math.max(12, height * 0.03);
      const vSpan = Math.max(1, height - hPad * 2);
      const totalPoints = Math.max(2, Math.ceil(vSpan / yGap));
      const oWidth = width + 200;
      const totalLines = Math.ceil(oWidth / xGap);
      const xStart = (width - xGap * totalLines) / 2;
      const yStart = hPad;

      linesRef.current = [];
      pathsRef.current.forEach((p) => p.remove());
      pathsRef.current = [];

      for (let i = 0; i <= totalLines; i++) {
        const points: WavePoint[] = [];
        for (let j = 0; j <= totalPoints; j++) {
          points.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "hero-waves__path");
        svg!.appendChild(path);
        pathsRef.current.push(path);
        linesRef.current.push(points);
      }

      drawLines();
    }

    function moved(point: WavePoint, withCursor: boolean) {
      const coords = {
        x: point.x + point.wave.x + (withCursor ? point.cursor.x : 0),
        y: point.y + point.wave.y + (withCursor ? point.cursor.y : 0),
      };
      return {
        x: Math.round(coords.x * 10) / 10,
        y: Math.round(coords.y * 10) / 10,
      };
    }

    function drawLines() {
      linesRef.current.forEach((points, lIndex) => {
        const path = pathsRef.current[lIndex];
        if (!path || points.length === 0) return;
        let p1 = moved(points[0], false);
        let d = `M ${p1.x} ${p1.y}`;
        points.forEach((pt, pIndex) => {
          const isLast = pIndex === points.length - 1;
          p1 = moved(pt, !isLast);
          d += ` L ${p1.x} ${p1.y}`;
        });
        path.setAttribute("d", d);
      });
    }

    function movePoints(time: number) {
      const noise = noiseRef.current!;
      const mouse = mouseRef.current;

      const waveScale = Math.max(1, boundingRef.current.height / 420);

      linesRef.current.forEach((points) => {
        points.forEach((p) => {
          const move =
            noise.perlin2((p.x + time * 0.0125) * 0.002, (p.y + time * 0.005) * 0.0015) * 12;
          p.wave.x = Math.cos(move) * 32 * waveScale;
          p.wave.y = Math.sin(move) * 18 * waveScale;

          if (interactiveRef.current) {
            const dx = p.x - mouse.sx;
            const dy = p.y - mouse.sy;
            const d = Math.hypot(dx, dy);
            const l = Math.max(175, mouse.vs, boundingRef.current.height * 0.22);

            if (d < l) {
              const s = 1 - d / l;
              const f = Math.cos(d * 0.001) * s;
              p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00065;
              p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00065;
            }

            p.cursor.vx += (0 - p.cursor.x) * 0.005;
            p.cursor.vy += (0 - p.cursor.y) * 0.005;
            p.cursor.vx *= 0.925;
            p.cursor.vy *= 0.925;
            p.cursor.x += p.cursor.vx * 2;
            p.cursor.y += p.cursor.vy * 2;
            p.cursor.x = Math.min(100, Math.max(-100, p.cursor.x));
            p.cursor.y = Math.min(100, Math.max(-100, p.cursor.y));
          }
        });
      });
    }

    function enableInteractive() {
      interactiveRef.current = true;
      container!.classList.add("is-interactive");
    }

    function tick(time: number) {
      const mouse = mouseRef.current;

      const waveLerp = waveSmoothing <= 0 ? 1 : waveSmoothing;
      mouse.sx += (mouse.x - mouse.sx) * waveLerp;
      mouse.sy += (mouse.y - mouse.sy) * waveLerp;

      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      const d = Math.hypot(dx, dy);
      mouse.v = d;
      mouse.vs += (d - mouse.vs) * 0.1;
      mouse.vs = Math.min(100, mouse.vs);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);

      movePoints(time);
      drawLines();
      rafRef.current = requestAnimationFrame(tick);
    }

    function updateMouse(clientX: number, clientY: number) {
      const rect = container!.getBoundingClientRect();
      const mouse = mouseRef.current;
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
    }

    function onPointerMove(e: PointerEvent) {
      updateMouse(e.clientX, e.clientY);
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch) updateMouse(touch.clientX, touch.clientY);
    }

    function onIntro() {
      enableInteractive();
      pausedRef.current = false;
      requestAnimationFrame(() => {
        setSize();
        setLines();
      });
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        pausedRef.current = !visible;
        if (visible && !reduced && interactiveRef.current) {
          if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
        } else if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      },
      { threshold: 0 },
    );

    const layoutWaves = () => {
      setSize();
      setLines();
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(layoutWaves);
    });
    observer.observe(container);

    const ro = new ResizeObserver(() => {
      layoutWaves();
    });
    ro.observe(container);

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    const onScroll = () => setSize();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else if (!reduced && interactiveRef.current) {
        pausedRef.current = false;
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      interactiveRef.current = false;
      drawLines();
    } else {
      pausedRef.current = false;
      rafRef.current = requestAnimationFrame(tick);

      if (interactiveMode === "immediate") {
        enableInteractive();
      } else {
        document.addEventListener(INTRO_EVENT, onIntro, { once: true });
      }
    }

    return () => {
      observer.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener(INTRO_EVENT, onIntro);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      container.classList.remove("is-interactive");
      pathsRef.current.forEach((p) => p.remove());
      pathsRef.current = [];
      linesRef.current = [];
    };
  }, [containerRef, svgRef, interactiveMode, waveSmoothing]);
}
