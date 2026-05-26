import { CTDP_NODE_DEFAULTS } from "@/lib/design/tokens";

export type CtdpNodeStateKey = "initial" | "executing" | "success" | "failed";

export type CtdpUiSettings = {
  nodeColors: Record<CtdpNodeStateKey, string>;
  edgeColor: string;
  nodeSize: number;
  labelZoomThreshold: number;
  /** 节点斥力强度 10–200 */
  forceStrength: number;
  appointmentMinutes: number;
  defaultFocusMinutes: number;
};

export const CTDP_UI_SETTINGS_KEY = "selfreg.ctdp.ui";

export const DEFAULT_CTDP_UI_SETTINGS: CtdpUiSettings = {
  nodeColors: {
    initial: CTDP_NODE_DEFAULTS.initial,
    executing: CTDP_NODE_DEFAULTS.executing,
    success: CTDP_NODE_DEFAULTS.success,
    failed: CTDP_NODE_DEFAULTS.failed,
  },
  edgeColor: CTDP_NODE_DEFAULTS.edge,
  nodeSize: 44,
  labelZoomThreshold: 0.78,
  forceStrength: 55,
  appointmentMinutes: 15,
  defaultFocusMinutes: 60,
};

export function loadCtdpUiSettings(
  serverDefaults?: Partial<Pick<CtdpUiSettings, "appointmentMinutes" | "defaultFocusMinutes">>,
): CtdpUiSettings {
  const base: CtdpUiSettings = {
    ...DEFAULT_CTDP_UI_SETTINGS,
    appointmentMinutes:
      serverDefaults?.appointmentMinutes ?? DEFAULT_CTDP_UI_SETTINGS.appointmentMinutes,
    defaultFocusMinutes:
      serverDefaults?.defaultFocusMinutes ?? DEFAULT_CTDP_UI_SETTINGS.defaultFocusMinutes,
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(CTDP_UI_SETTINGS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<CtdpUiSettings>;
    return {
      ...base,
      ...parsed,
      nodeColors: { ...base.nodeColors, ...parsed.nodeColors },
      forceStrength: parsed.forceStrength ?? base.forceStrength,
    };
  } catch {
    return base;
  }
}

export function saveCtdpUiSettings(settings: CtdpUiSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CTDP_UI_SETTINGS_KEY, JSON.stringify(settings));
}
