"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion/prefersReducedMotion";

export const INTRO_EVENT = "srs-intro";

export function SiteIntro({ onComplete }: { onComplete: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion()) {
      document.documentElement.classList.add("is-loaded");
      document.dispatchEvent(new CustomEvent(INTRO_EVENT));
      onComplete();
      setVisible(false);
      return;
    }

    document.documentElement.classList.add("is-scroll-blocked");
    const root = rootRef.current;
    if (!root) return;

    const barsV = root.querySelectorAll<HTMLElement>(".js-logo-v");
    const barsH = root.querySelectorAll<HTMLElement>(".js-logo-h");
    const borderTop = root.querySelector<HTMLElement>(".js-border-top");
    const borderLeft = root.querySelector<HTMLElement>(".js-border-left");
    const borderRight = root.querySelector<HTMLElement>(".js-border-right");

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.classList.remove("is-scroll-blocked");
        document.documentElement.classList.add("is-loaded");
        onComplete();
        setVisible(false);
      },
    });

    tl.fromTo(barsV, { scaleY: 0 }, { scaleY: 1, duration: 1, ease: "power4.inOut", stagger: 0.15 }, 0);
    tl.fromTo(barsH, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power4.inOut" }, 1);
    tl.set(barsV, { transformOrigin: "50% 0" });
    tl.fromTo(
      barsV,
      { scaleY: 1 },
      { scaleY: 0, duration: 1, ease: "power4.in", stagger: 0.1 },
      2,
    );
    tl.fromTo(
      barsH,
      { scaleY: 1 },
      { scaleY: 0, duration: 0.5, ease: "power4.in", stagger: 0.1 },
      2.1,
    );

    if (borderTop) {
      tl.from(borderTop, { scaleY: 0, duration: 3, ease: "power3.inOut" }, 1);
    }
    if (borderLeft && borderRight) {
      tl.from([borderLeft, borderRight], { scaleX: 0, duration: 3, ease: "power3.inOut" }, 1);
    }

    tl.call(
      () => {
        document.dispatchEvent(new CustomEvent(INTRO_EVENT));
      },
      undefined,
      "-=1.85",
    );

    return () => {
      tl.kill();
      document.documentElement.classList.remove("is-scroll-blocked");
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div ref={rootRef} className="site-intro" aria-hidden>
      <div className="site-intro__logo" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={`v-${i}`}
            className={`site-intro__bar intro-logo-v intro-logo-v--${i} js-logo-v`}
          />
        ))}
        <span className="site-intro__bar intro-logo-h--top js-logo-h" />
        <span className="site-intro__bar intro-logo-h--mid js-logo-h" />
        <span className="site-intro__bar intro-logo-h--end js-logo-h" />
      </div>
      <span className="site-intro__border site-intro__border--top js-border-top" />
      <span className="site-intro__border site-intro__border--left js-border-left" />
      <span className="site-intro__border site-intro__border--right js-border-right" />
    </div>
  );
}
