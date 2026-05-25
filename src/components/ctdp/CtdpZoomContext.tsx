"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const CtdpZoomContext = createContext<{
  zoom: number;
  showLabels: boolean;
  setZoom: (z: number) => void;
  labelZoomThreshold: number;
} | null>(null);

export function CtdpZoomProvider({
  children,
  labelZoomThreshold = 0.78,
}: {
  children: ReactNode;
  labelZoomThreshold?: number;
}) {
  const [zoom, setZoom] = useState(1);
  const showLabels = zoom >= labelZoomThreshold;

  const value = useMemo(
    () => ({ zoom, showLabels, setZoom, labelZoomThreshold }),
    [zoom, showLabels, labelZoomThreshold],
  );

  return (
    <CtdpZoomContext.Provider value={value}>{children}</CtdpZoomContext.Provider>
  );
}

export function useCtdpZoom() {
  const ctx = useContext(CtdpZoomContext);
  if (!ctx) {
    return { zoom: 1, showLabels: true, setZoom: () => {}, labelZoomThreshold: 0.78 };
  }
  return ctx;
}
