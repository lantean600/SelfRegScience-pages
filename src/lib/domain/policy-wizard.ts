export type BacktrackStep = {
  description: string;
  tendencyGap?: number;
};

export function generatePolicyDraft(params: {
  steadyStateTarget: string;
  backtrackSteps: BacktrackStep[];
  interventionIndex: number;
}) {
  const step = params.backtrackSteps[params.interventionIndex];
  if (!step) throw new Error("INVALID_INTERVENTION_INDEX");

  const title = `干预：${step.description}`;
  const type =
    step.tendencyGap !== undefined && step.tendencyGap <= 0.4
      ? "passive"
      : "semi_passive";

  return {
    title,
    type,
    interventionNode: step.description,
    steadyStateTarget: params.steadyStateTarget,
    isRelevant: true,
    difficulty: type === "passive" ? 2 : 3,
    maintenanceCost: type === "passive" ? 2 : 3,
    triggerJson:
      type === "semi_passive"
        ? JSON.stringify({ event: "custom", description: step.description })
        : null,
    constraintJson:
      type === "passive"
        ? JSON.stringify({ forbid: step.description, context: params.steadyStateTarget })
        : null,
  };
}
