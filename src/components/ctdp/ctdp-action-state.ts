import { isAppointmentOverdue } from "@/lib/date-utils";
import type { CtdpNodeRow } from "@/components/canvas/CtdpCanvas";

export type CtdpActionState = {
  canEdit: boolean;
  canArm: boolean;
  canTrigger: boolean;
  canCompleteFocus: boolean;
  canAbandon: boolean;
  canJudge: boolean;
  canDelete: boolean;
  appointmentDeadline: string | null;
};

export function getCtdpActionState(node: CtdpNodeRow, loading = false): CtdpActionState {
  const appointmentDeadline = node.appointments[0]?.deadlineAt ?? null;

  return {
    canEdit: !loading,
    canArm: node.state === "initial" && !node.pendingAppointmentId && !node.awaitingJudgment,
    canTrigger:
      node.state === "initial" &&
      Boolean(node.pendingAppointmentId) &&
      Boolean(appointmentDeadline) &&
      !node.awaitingJudgment &&
      !isAppointmentOverdue(appointmentDeadline),
    canCompleteFocus: node.state === "executing" && Boolean(node.activeSessionId),
    canAbandon: node.state === "executing",
    canJudge: node.awaitingJudgment,
    canDelete: true,
    appointmentDeadline,
  };
}
