"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PublicMasthead } from "@/components/layout/PublicMasthead";
import { SiteIntro } from "@/components/motion/SiteIntro";
import { useScrollSpine } from "@/components/motion/useScrollSpine";
import { AboutSection } from "@/components/marketing/AboutSection";
import { EnterCtaSection } from "@/components/marketing/EnterCtaSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { MechanicsScroll } from "@/components/marketing/MechanicsScroll";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

export function MarketingHome() {
  const [introDone, setIntroDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const r = prefersReducedMotion();
    setReduced(r);
    if (r) {
      document.documentElement.classList.add("is-loaded");
      setIntroDone(true);
    }
  }, []);

  const spineRef = useRef<HTMLDivElement>(null);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);
  useScrollSpine(spineRef, introDone);

  return (
    <>
      {!introDone && !reduced && <SiteIntro onComplete={handleIntroComplete} />}
      <div className={introDone ? "marketing-mount is-visible" : "marketing-mount"}>
        {introDone && <PublicMasthead />}
        <main ref={spineRef} className="marketing-page">
          <HeroSection />
          <AboutSection />
          <MechanicsScroll />
          <EnterCtaSection />
        </main>
      </div>
    </>
  );
}
