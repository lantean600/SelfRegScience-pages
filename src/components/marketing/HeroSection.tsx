"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroWavesInteractive } from "@/components/marketing/HeroWavesInteractive";
import { useHeroCharTick, useHeroIntro } from "@/components/motion/useHeroIntro";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  useHeroIntro(heroRef);
  useHeroCharTick(heroRef);

  return (
    <section ref={heroRef} className="hero-section" aria-label="主视觉">
      <HeroWavesInteractive variant="marketing" interactiveMode="afterIntro" />
      <div className="hero-lower">
        <div className="hero-content js-hero-content">
          <h1 className="hero-title text-hero-title js-hero-title">
            <span className="hero-word" data-split-word>
              协议
            </span>
            <span className="hero-word" data-split-word>
              约束
            </span>
          </h1>
        </div>
        <div className="hero-sub">
          <p className="text-editorial-body text-base leading-relaxed">
            以链式时延与递归稳态，把执行力从意志对抗改成可裁决、可演化、可复盘的工程系统。
          </p>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 w-full max-w-sm mx-auto">
            <Button href="/register" size="lg" className="w-full sm:w-auto">
              开始记录
            </Button>
            <Button href="/guide" variant="secondary" size="lg" className="w-full sm:w-auto">
              交互式概览
            </Button>
            <Link href="/login" className="text-caption no-underline hover:underline">
              登录
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
