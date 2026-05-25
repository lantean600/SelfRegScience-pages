/** Wodniack-inspired dark system — contrast tests & CTDP canvas defaults */

export const DARK_TOKENS = {
  surface: "#0c0b0a",
  panel: "#161412",
  ink: "#f2ece3",
  inkMuted: "#9a9288",
  accent: "#f2ece3",
  accentFg: "#0c0b0a",
  editorialAccent: "#c9b896",
  signal: "#e07a5a",
  signalFg: "#0c0b0a",
  figureBg: "#121110",
} as const;

export const LIGHT_TOKENS = {
  surface: "#f4efe6",
  panel: "#faf7f2",
  ink: "#121110",
  inkMuted: "#5c564e",
  accent: "#121110",
  accentFg: "#f4efe6",
  editorialAccent: "#8b5a3c",
  signal: "#b65b39",
  signalFg: "#ffffff",
  figureBg: "#faf7f2",
} as const;

export const CTDP_NODE_DEFAULTS = {
  initial: "#6b7280",
  executing: "#5b9a94",
  success: "#6b9a7a",
  failed: "#c46b55",
  edge: "#5a554e",
} as const;

export const CONTRAST_PAIRS = [
  { name: "dark ink/surface", fg: DARK_TOKENS.ink, bg: DARK_TOKENS.surface, min: 4.5 },
  { name: "dark ink-muted/panel", fg: DARK_TOKENS.inkMuted, bg: DARK_TOKENS.panel, min: 4.5 },
  { name: "dark accent-fg/accent", fg: DARK_TOKENS.accentFg, bg: DARK_TOKENS.accent, min: 4.5 },
  { name: "light ink/surface", fg: LIGHT_TOKENS.ink, bg: LIGHT_TOKENS.surface, min: 4.5 },
  { name: "light ink-muted/panel", fg: LIGHT_TOKENS.inkMuted, bg: LIGHT_TOKENS.panel, min: 4.5 },
  { name: "light accent-fg/accent", fg: LIGHT_TOKENS.accentFg, bg: LIGHT_TOKENS.accent, min: 4.5 },
] as const;
