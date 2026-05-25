export const SCOPE_TYPES = [
  "CTDP_NODE",
  "AUX_CHAIN",
  "POLICY",
  "POLICY_GROUP",
] as const;

export const CTDP_NODE_STATES = [
  "initial",
  "executing",
  "success",
  "failed",
] as const;

export type ScopeType = (typeof SCOPE_TYPES)[number];

export const FOCUS_SESSION_STATUS = [
  "idle",
  "appointment_pending",
  "sacred_triggered",
  "focusing",
  "completed",
  "violated_reset",
  "cancelled",
] as const;

export const UNIT_TYPES = [
  "assault",
  "recon",
  "command",
  "special",
  "engineering",
  "logistics",
] as const;

export const SCOUT_MINUTES = 5;
export const DEFAULT_FOCUS_MINUTES = 60;

export const COLLAPSE_REASON_TAGS = [
  "cost_too_high",
  "fatigue",
  "forgot",
  "incompatible",
  "too_ambitious",
  "other",
] as const;
