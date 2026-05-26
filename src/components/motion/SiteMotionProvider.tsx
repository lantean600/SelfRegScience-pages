"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INTRO_EVENT } from "@/components/motion/SiteIntro";
import { APP_ROUTE_PREFIXES } from "@/lib/motion/app-routes";
import { prefersNativeScroll } from "@/lib/motion/device-motion";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const MARKETING_HOME = "/";

function useNativeScroll(pathname: string) {
  if (prefersNativeScroll()) return true;
  return APP_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function clearScrollLocks() {
  document.documentElement.classList.remove("is-scroll-blocked");
}

function applyMotionDataset() {
  const reduced = prefersReducedMotion();
  document.documentElement.dataset.motion = reduced ? "reduced" : "enhanced";
}

export function SiteMotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nativeScroll = useNativeScroll(pathname);
  const motionRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyMotionDataset();
  }, [pathname]);

  useEffect(() => {
    clearScrollLocks();

    if (nativeScroll) {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!nativeScroll && pathname === MARKETING_HOME) {
          ScrollTrigger.refresh();
        }
      });
    });

    return () => cancelAnimationFrame(id);
  }, [pathname, nativeScroll]);

  useEffect(() => {
    if (prefersReducedMotion() || nativeScroll) return;

    const lenis = new Lenis({
      duration: 0.95,
      smoothWheel: true,
      gestureOrientation: "vertical",
      touchMultiplier: 1.05,
      wheelMultiplier: 1,
    });

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length && typeof value === "number") {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const onIntro = () => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    document.addEventListener(INTRO_EVENT, onIntro);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return () => {
      document.removeEventListener(INTRO_EVENT, onIntro);
      gsap.ticker.remove(raf);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      ScrollTrigger.scrollerProxy(document.documentElement, {});
    };
  }, [nativeScroll]);

  return <div ref={motionRootRef}>{children}</div>;
}
