import { CtdpNode } from "@/components/canvas/nodes/CtdpNode";
import { SacredSeatNode } from "@/components/canvas/nodes/SacredSeatNode";
import { MainChainNode } from "@/components/canvas/nodes/MainChainNode";
import { AppointmentNode } from "@/components/canvas/nodes/AppointmentNode";
import { FocusSessionNode } from "@/components/canvas/nodes/FocusSessionNode";
import { PolicyNode } from "@/components/canvas/nodes/PolicyNode";
import { PolicyTreeRootNode } from "@/components/canvas/nodes/PolicyTreeRootNode";
import { EchelonNode } from "@/components/canvas/nodes/EchelonNode";
import { GroupNode } from "@/components/canvas/nodes/GroupNode";
import { UnitNode } from "@/components/canvas/nodes/UnitNode";

export const canvasNodeTypes = {
  ctdpNode: CtdpNode,
  sacredSeat: SacredSeatNode,
  mainChain: MainChainNode,
  appointment: AppointmentNode,
  focusSession: FocusSessionNode,
  policy: PolicyNode,
  policyRoot: PolicyTreeRootNode,
  policyOrphan: PolicyNode,
  echelon: EchelonNode,
  group: GroupNode,
  unit: UnitNode,
};
