import { TriggerEdge } from "@/components/canvas/edges/TriggerEdge";
import { RefTargetEdge } from "@/components/canvas/edges/RefTargetEdge";
import { StackEdge } from "@/components/canvas/edges/StackEdge";
import { GroupEdge } from "@/components/canvas/edges/GroupEdge";

export const canvasEdgeTypes = {
  trigger: TriggerEdge,
  refTarget: RefTargetEdge,
  stack: StackEdge,
  group: GroupEdge,
};
