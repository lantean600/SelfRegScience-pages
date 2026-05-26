"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INTRO_EVENT } from "@/components/motion/SiteIntro";
import { prefersNativeScroll } from "@/lib/motion/device-motion";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const MARKETING_HOME = "/";
const APP_ROUTE_PREFIXES = ["/dashboard", "/ctdp", "/rsip", "/review", "/guide"];

function useNativeScroll(pathname: string) {
  if (prefersNativeScroll()) return true;
  return APP_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function clearScrollLocks() {
  document.documentElement.classList.remove("is-scroll-blocked");
}

export function SiteMotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nativeScroll = useNativeScroll(pathname);
  const motionRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearScrollLocks();

    if (nativeScroll) {
      window.scrollTo(0, 0);
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
    const reduced = prefersReducedMotion();
    document.documentElement.dataset.motion = reduced ? "reduced" : "enhanced";
    if (reduced || nativeScroll) return;

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
      delete document.documentElement.dataset.motion;
    };
  }, [nativeScroll]);

  return <div ref={motionRootRef}>{children}</div>;
}
