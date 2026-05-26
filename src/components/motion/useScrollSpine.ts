"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INTRO_EVENT } from "@/components/motion/SiteIntro";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function useScrollSpine(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || prefersReducedMotion()) return;

    let ctx: gsap.Context | undefined;
    let mm: ReturnType<typeof ScrollTrigger.matchMedia> | undefined;

    const mount = () => {
      ctx?.revert();
      ctx = undefined;
      mm?.revert();
      mm = undefined;

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

        mm = ScrollTrigger.matchMedia({
          "(min-width: 768px)": () => {
            const pin = root.querySelector<HTMLElement>(".js-mechanics-pin");
            const track = root.querySelector<HTMLElement>(".js-mechanics-track");
            if (!pin || !track) return;

            const panels = track.querySelectorAll<HTMLElement>(".mechanics-panel");
            const syncPanelWidths = () => {
              const w = pin.offsetWidth;
              panels.forEach((panel) => {
                panel.style.flexBasis = `${w}px`;
                panel.style.width = `${w}px`;
              });
            };
            syncPanelWidths();

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
                pinSpacing: true,
                scrub: 0.5,
                snap: 1 / (panels.length - 1),
                invalidateOnRefresh: true,
                onRefresh: syncPanelWidths,
              },
            });
          },
          "(max-width: 767px)": () => {
            root.querySelectorAll<HTMLElement>(".mechanics-panel").forEach((el) => {
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
          },
        });
      }, root);

      const refresh = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => ScrollTrigger.refresh());
        });
      };
      refresh();
    };

    const onIntro = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    };

    mount();
    document.addEventListener(INTRO_EVENT, onIntro);

    return () => {
      document.removeEventListener(INTRO_EVENT, onIntro);
      mm?.revert();
      ctx?.revert();
    };
  }, [rootRef, enabled]);
}
