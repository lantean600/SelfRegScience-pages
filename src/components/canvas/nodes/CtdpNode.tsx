"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useCtdpSettings } from "@/components/ctdp/CtdpSettingsContext";
import { useCtdpZoom } from "@/components/ctdp/CtdpZoomContext";
import { NodeCountdownBadge } from "@/components/canvas/nodes/NodeCountdownBadge";
import { cn } from "@/lib/cn";
import type { CtdpNodeStateKey } from "@/lib/ctdp-ui-settings";
import type { CanvasNodeData } from "@/components/canvas/types";
import type { CSSProperties } from "react";

const STATE_LABELS: Record<CtdpNodeStateKey, string> = {
  initial: "待执行",
  executing: "执行中",
  success: "已完成",
  failed: "已失败",
};

export function CtdpNode({ data, selected }: NodeProps) {
  const d = data as CanvasNodeData;
  const { settings } = useCtdpSettings();
  const { showLabels } = useCtdpZoom();
  const state = ((d.meta?.state as string) ?? "initial") as CtdpNodeStateKey;
  const color = settings.nodeColors[state] ?? settings.nodeColors.initial;
  const size = settings.nodeSize;
  const armed = Boolean(d.meta?.armed);
  const awaiting = Boolean(d.meta?.awaitingJudgment);
  const executing = state === "executing";
  const labelVisible = showLabels || selected;
  const refCount = Number(d.meta?.refCount ?? 0);
  const appointmentDeadline = d.meta?.appointmentDeadline as string | null | undefined;
  const focusStartedAt = d.meta?.focusStartedAt as string | null | undefined;
  const focusTargetMinutes = d.meta?.focusTargetMinutes as number | null | undefined;
  const countdownMin = d.meta?.countdownMin as number | undefined;
  const showAppointmentCountdown = armed && (appointmentDeadline || countdownMin != null);
  const showFocusCountdown =
    executing &&
    (countdownMin != null || (Boolean(focusStartedAt) && focusTargetMinutes != null));

  const rootStyle = {
    "--ctdp-node-size": `${size}px`,
    "--ctdp-node-fill": color,
  } as CSSProperties;

  return (
    <div className="ctdp-node-root" style={rootStyle}>
      <Handle type="target" position={Position.Top} className="ctdp-handle-center" />
      <Handle type="source" position={Position.Bottom} className="ctdp-handle-center" />

      {armed && <span aria-hidden className="ctdp-ring ctdp-ring-armed" />}
      {awaiting && !armed && <span aria-hidden className="ctdp-ring ctdp-ring-awaiting" />}
      {executing && !armed && !awaiting && (
        <span aria-hidden className="ctdp-ring ctdp-executing-ring" />
      )}

      <div
        className={cn(
          "ctdp-node-disc",
          selected && "is-selected",
          state === "failed" && "is-failed",
        )}
      />
      <div className="ctdp-node-highlight" aria-hidden />

      {(showAppointmentCountdown || showFocusCountdown) && (
        <NodeCountdownBadge
          deadline={showAppointmentCountdown ? (appointmentDeadline ?? undefined) : undefined}
          startedAt={showFocusCountdown ? (focusStartedAt ?? undefined) : undefined}
          durationMinutes={showFocusCountdown ? (focusTargetMinutes ?? undefined) : undefined}
          staticMinutes={countdownMin}
        />
      )}

      <div
        className={cn("ctdp-node-label-wrap transition-opacity duration-200", {
          "opacity-100": labelVisible,
          "opacity-0": !labelVisible,
        })}
      >
        <p className="ctdp-node-label truncate" title={d.label}>
          {d.label}
        </p>
        {selected && (
          <p className="ctdp-node-sublabel">
            {STATE_LABELS[state]}
            {!armed && !awaiting && refCount > 0 && ` · ref ${refCount}`}
          </p>
        )}
      </div>
    </div>
  );
}
