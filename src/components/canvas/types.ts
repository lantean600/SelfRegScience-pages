import type { Node } from "@xyflow/react";

export type CanvasNodeKind =
  | "ctdpNode"
  | "sacredSeat"
  | "mainChain"
  | "appointment"
  | "focusSession"
  | "policy"
  | "policyRoot"
  | "policyOrphan"
  | "echelon"
  | "group"
  | "unit";

export type CanvasNodeData = {
  kind: CanvasNodeKind;
  label: string;
  sublabel?: string;
  entityId: string;
  meta?: Record<string, unknown>;
  selected?: boolean;
  highlighted?: boolean;
};

export type CanvasNode = Node<CanvasNodeData>;

export type InspectorTarget = {
  kind: CanvasNodeKind;
  entityId: string;
  data: CanvasNodeData;
} | null;
