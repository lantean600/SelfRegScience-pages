"use client";

import type { CSSProperties, ReactNode } from "react";
import type { CtdpUiSettings } from "@/lib/ctdp-ui-settings";

/** 将用户 CTDP 设置注入画布 CSS 变量（登记的白名单 inline） */
export function CtdpCanvasTheme({
  settings,
  children,
  className,
}: {
  settings: CtdpUiSettings;
  children: ReactNode;
  className?: string;
}) {
  const style = {
    "--ctdp-edge-color": settings.edgeColor,
    "--ctdp-node-initial": settings.nodeColors.initial,
    "--ctdp-node-executing": settings.nodeColors.executing,
    "--ctdp-node-success": settings.nodeColors.success,
    "--ctdp-node-failed": settings.nodeColors.failed,
  } as CSSProperties;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
