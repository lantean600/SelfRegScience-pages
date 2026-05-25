"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { INTRO_EVENT } from "@/components/motion/SiteIntro";
import { splitChars } from "@/lib/motion/splitChars";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

export function useHeroIntro(heroRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reduced = prefersReducedMotion();
    const title = hero.querySelector<HTMLElement>(".js-hero-title");
    const content = hero.querySelector<HTMLElement>(".js-hero-content");
    const waves = hero.querySelector<HTMLElement>(".js-hero-waves");

    if (title) splitChars(title);

    const runIntro = () => {
      if (reduced) {
        hero.classList.add("is-ready");
        return;
      }

      const chars = hero.querySelectorAll<HTMLElement>(".hero-char__inner");

      const tl = gsap.timeline();
      tl.set(hero, { opacity: 1 }, 0);

      if (waves) {
        tl.from(waves, { opacity: 0, duration: 0.6, ease: "power2.out" }, 0);
      }

      if (content) {
        tl.fromTo(
          content,
          { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            duration: 1,
            ease: "expo.inOut",
          },
          0.4,
        );
      }

      if (chars.length) {
        tl.fromTo(
          chars,
          { y: "-120%" },
          { y: "0%", duration: 1.4, ease: "expo.inOut", stagger: 0.015 },
          0.35,
        );
      }

      tl.call(() => hero.classList.add("is-ready"), undefined, 0.8);
    };

    if (reduced) {
      runIntro();
      return;
    }

    document.addEventListener(INTRO_EVENT, runIntro, { once: true });
    return () => document.removeEventListener(INTRO_EVENT, runIntro);
  }, [heroRef]);
}

export function useHeroCharTick(heroRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const hero = heroRef.current;
    if (!hero) return;

    let waiting = true;
    const onIntro = () => {
      waiting = false;
    };
    document.addEventListener(INTRO_EVENT, onIntro, { once: true });

    const directions = ["to-top", "to-right", "to-bottom", "to-left"] as const;

    const tick = () => {
      if (waiting || Math.random() > 0.012) return;
      const chars = hero.querySelectorAll<HTMLElement>(".hero-char");
      if (!chars.length) return;
      const char = chars[Math.floor(Math.random() * chars.length)];
      if (directions.some((d) => char.classList.contains(d))) return;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      char.classList.add(dir);
      window.setTimeout(() => char.classList.remove(dir), 2000);
    };

    const id = window.setInterval(tick, 80);
    return () => {
      clearInterval(id);
      document.removeEventListener(INTRO_EVENT, onIntro);
    };
  }, [heroRef]);
}
