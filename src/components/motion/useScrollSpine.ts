"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_MQ = "(min-width: 768px)";

export function useScrollSpine(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const desktop = window.matchMedia(DESKTOP_MQ);
    let ctx: gsap.Context | undefined;

    const mount = () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const about = root.querySelector<HTMLElement>(".js-about");
        if (about) {
          gsap.fromTo(
            about.querySelectorAll<HTMLElement>(".js-about-line"),
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: "power3.out",
              scrollTrigger: { trigger: about, start: "top 78%", once: true },
            },
          );
        }

        root.querySelectorAll<HTMLElement>(".mechanics-stack__panel").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });

        const track = root.querySelector<HTMLElement>(".js-mechanics-track");
        const pin = root.querySelector<HTMLElement>(".js-mechanics-pin");
        if (track && pin && desktop.matches) {
          const panels = track.querySelectorAll<HTMLElement>(".mechanics-panel");
          const getScrollDistance = () => {
            const first = panels[0];
            if (!first) return 0;
            return Math.max(0, (panels.length - 1) * first.offsetWidth);
          };

          gsap.to(track, {
            x: () => -getScrollDistance(),
            ease: "none",
            scrollTrigger: {
              trigger: pin,
              start: "top top",
              end: () => `+=${getScrollDistance()}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        const cta = root.querySelector<HTMLElement>(".js-cta");
        if (cta) {
          gsap.fromTo(
            cta,
            { opacity: 0, y: 48 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: cta, start: "top 82%", once: true },
            },
          );
        }
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    mount();
    desktop.addEventListener("change", mount);

    return () => {
      desktop.removeEventListener("change", mount);
      ctx?.revert();
    };
  }, [rootRef]);
}
