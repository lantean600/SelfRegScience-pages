import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, parseBody } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk({
      defaultAppointmentMin: user.defaultAppointmentMin,
      defaultFocusMinutes: user.defaultFocusMinutes,
    });
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody<{
      defaultAppointmentMin?: number;
      defaultFocusMinutes?: number;
    }>(request);

    const data: { defaultAppointmentMin?: number; defaultFocusMinutes?: number } = {};
    if (body.defaultAppointmentMin != null) {
      const v = Math.round(body.defaultAppointmentMin);
      if (v < 1 || v > 240) return jsonError("INVALID_APPOINTMENT_MIN", 400);
      data.defaultAppointmentMin = v;
    }
    if (body.defaultFocusMinutes != null) {
      const v = Math.round(body.defaultFocusMinutes);
      if (v < 5 || v > 480) return jsonError("INVALID_FOCUS_MIN", 400);
      data.defaultFocusMinutes = v;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return jsonOk({
      defaultAppointmentMin: updated.defaultAppointmentMin,
      defaultFocusMinutes: updated.defaultFocusMinutes,
    });
  } catch {
    return jsonError("UNAUTHORIZED", 401);
  }
}
