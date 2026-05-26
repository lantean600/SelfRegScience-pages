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
const NATIVE_SCROLL_ROUTES = ["/ctdp", "/rsip"];

function useNativeScroll(pathname: string) {
  if (prefersNativeScroll()) return true;
  return NATIVE_SCROLL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function clearScrollLocks() {
  document.documentElement.classList.remove("is-scroll-blocked");
}

function killAppScrollTriggers() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  ScrollTrigger.clearScrollMemory?.();
}

export function SiteMotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nativeScroll = useNativeScroll(pathname);
  const motionRootRef = useRef<HTMLDivElement>(null);
  const revealCtxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    revealCtxRef.current?.revert();
    revealCtxRef.current = null;
    killAppScrollTriggers();
    clearScrollLocks();

    if (nativeScroll) {
      window.scrollTo(0, 0);
    }
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

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (pathname === MARKETING_HOME) return;

    const scope = motionRootRef.current ?? undefined;

    revealCtxRef.current?.revert();
    const ctx = gsap.context(() => {
      const staggerGroups = gsap.utils.toArray<HTMLElement>("[data-stagger]");
      staggerGroups.forEach((group) => {
        const children = Array.from(group.children) as HTMLElement[];
        if (children.length === 0) return;
        gsap.fromTo(
          children,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power3.out",
            stagger: 0.05,
            scrollTrigger: { trigger: group, start: "top 86%", once: true },
          },
        );
      });

      const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });
    }, scope);

    revealCtxRef.current = ctx;

    const refresh = () => ScrollTrigger.refresh();
    requestAnimationFrame(refresh);

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 150);
    };
    window.addEventListener("orientationchange", refresh);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("orientationchange", refresh);
      window.visualViewport?.removeEventListener("resize", onResize);
      ctx.revert();
      if (revealCtxRef.current === ctx) {
        revealCtxRef.current = null;
      }
    };
  }, [pathname]);

  return <div ref={motionRootRef}>{children}</div>;
}
