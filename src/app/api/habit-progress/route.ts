import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { getHabitProgress } from "@/lib/domain/habit-progress";
import { effectiveMaintenanceCost } from "@/lib/domain/habit-progress";

export async function GET() {
  try {
    const user = await requireUser();
    const progress = await getHabitProgress(user.id);
    const enriched = progress.map((p) => ({
      ...p,
      effectiveMaintenanceCost: effectiveMaintenanceCost(
        p.policy.maintenanceCost,
        p.internalizationDays,
      ),
    }));
    return jsonOk(enriched);
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
