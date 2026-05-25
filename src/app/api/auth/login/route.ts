import { verifyPassword, attachSessionCookie } from "@/lib/auth";
import { requireSessionSecretForRequest } from "@/lib/resolve-session-secret";
import { jsonOk, jsonError, parseBody, jsonServerError } from "@/lib/api-utils";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionSecret = await requireSessionSecretForRequest();
    const prisma = await getDb();
    const body = await parseBody<{ email: string; password: string }>(request);
    if (!body.email?.trim() || !body.password) {
      return jsonError("请输入邮箱和密码", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email.trim() },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return jsonError("邮箱或密码错误", 401);
    }

    const response = jsonOk({ id: user.id, email: user.email });
    attachSessionCookie(response, user.id, sessionSecret, request);
    return response;
  } catch (error) {
    return jsonServerError("[auth/login]", error);
  }
}
