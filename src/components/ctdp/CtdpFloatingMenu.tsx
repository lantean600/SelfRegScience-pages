"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { clampMenuPosition } from "@/lib/clamp-menu-position";

export type MenuItem =
  | { type: "item"; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }
  | { type: "separator" };

export function CtdpFloatingMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    setPos(clampMenuPosition(x, y, ref.current));
  }, [x, y, items.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[168px] rounded-sm border border-rule bg-panel py-1 shadow-lg"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((item, i) =>
        item.type === "separator" ? (
          <hr key={`sep-${i}`} className="my-1 border-rule" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={cn(
              "w-full min-h-11 text-left px-3 py-2 text-sm hover:bg-surface/80 disabled:opacity-40",
              item.danger && "text-signal",
            )}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
