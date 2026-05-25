import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", 401);
  return jsonOk({
    id: user.id,
    email: user.email,
    timezone: user.timezone,
    defaultFocusMinutes: user.defaultFocusMinutes,
    defaultAppointmentMin: user.defaultAppointmentMin,
  });
}
