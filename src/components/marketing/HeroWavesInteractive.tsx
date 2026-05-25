"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import {
  useHeroWaves,
  type HeroWavesOptions,
} from "@/components/marketing/useHeroWaves";

type HeroWavesInteractiveProps = {
  variant?: "marketing" | "dashboard";
  interactiveMode?: HeroWavesOptions["interactiveMode"];
};

export function HeroWavesInteractive({
  variant = "marketing",
  interactiveMode = "afterIntro",
}: HeroWavesInteractiveProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useHeroWaves(stageRef, svgRef, {
    interactiveMode,
    dotSmoothing: 0,
    waveSmoothing: 0.12,
  });

  return (
    <div
      ref={stageRef}
      className={cn(
        "hero-waves-stage js-hero-waves",
        variant === "marketing" && "hero-waves-stage--marketing",
        variant === "dashboard" && "hero-waves-stage--dashboard",
      )}
      aria-hidden
    >
      <svg ref={svgRef} className="hero-waves-svg" aria-hidden />
      {variant === "marketing" && (
        <div className="hero-binary-strip" aria-hidden>
          {BINARY_STRIP}
        </div>
      )}
    </div>
  );
}

const BINARY_STRIP =
  "01010101 / 11001100 / 10101010 / 01011010 / 00110011 / 11110000 / 01010101 / 11001100 / 10101010 / 01011010 / 00110011 / 11110000 / ";
