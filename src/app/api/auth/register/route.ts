import { hashPassword, attachSessionCookie } from "@/lib/auth";
import { requireSessionSecretForRequest } from "@/lib/resolve-session-secret";
import { jsonOk, jsonError, parseBody, jsonServerError } from "@/lib/api-utils";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionSecret = await requireSessionSecretForRequest();
    const prisma = await getDb();
    const body = await parseBody<{ email: string; password: string }>(request);
    if (!body.email?.trim() || !body.password) {
      return jsonError("缺少邮箱或密码", 400);
    }

    const email = body.email.trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return jsonError("邮箱已注册", 409);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
      },
    });

    const response = jsonOk({ id: user.id, email: user.email });
    attachSessionCookie(response, user.id, sessionSecret, request);
    return response;
  } catch (error) {
    return jsonServerError("[auth/register]", error);
  }
}
