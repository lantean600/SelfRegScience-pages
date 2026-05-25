import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  requireSessionSecretForRequest,
  resolveSessionSecretAsync,
} from "@/lib/resolve-session-secret";
import { getDb } from "@/lib/db";

const SESSION_COOKIE = "srs_session";
const SESSION_DAYS = 30;

let sessionSecretWarned = false;

/** Prefer requireSessionSecretForRequest() at Route Handler entry; tests may call this directly. */
export async function getSessionSecret(): Promise<string> {
  const secret = await resolveSessionSecretAsync();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  if (!sessionSecretWarned) {
    console.warn(
      "[auth] SESSION_SECRET is not set; using an insecure development default",
    );
    sessionSecretWarned = true;
  }

  return "dev-insecure-session-secret";
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Creates a signed session token: `{userId}.{nonce}.{hmac}`. */
export function signSessionToken(userId: string, secret: string): string {
  const nonce = randomUUID();
  const payload = `${userId}.${nonce}`;
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Verifies a session token and returns the userId, or null if invalid/tampered.
 * Rejects legacy unsigned tokens (`userId.uuid` with no HMAC segment).
 */
export function verifySessionToken(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, nonce, signature] = parts;
  if (!userId || !nonce || !signature) return null;

  const payload = `${userId}.${nonce}`;
  const expected = signPayload(payload, secret);

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  return userId;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

const SESSION_TOKEN_RE = /^[a-zA-Z0-9._-]+$/;

function sessionCookieSecure(request?: Request): boolean {
  if (request) return new URL(request.url).protocol === "https:";
  return process.env.NODE_ENV === "production";
}

function buildSessionToken(userId: string, sessionSecret: string): string {
  const token = signSessionToken(userId, sessionSecret);
  if (!SESSION_TOKEN_RE.test(token)) {
    throw new Error("Invalid session token encoding");
  }
  return token;
}

/** Set session on the same NextResponse returned from a Route Handler (required on Workers). */
export function attachSessionCookie(
  response: NextResponse,
  userId: string,
  sessionSecret: string,
  request?: Request,
): void {
  response.cookies.set(SESSION_COOKIE, buildSessionToken(userId, sessionSecret), {
    httpOnly: true,
    secure: sessionCookieSecure(request),
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}

/** @deprecated Prefer attachSessionCookie on the route's NextResponse. */
export async function createSession(userId: string, request?: Request) {
  const sessionSecret = await requireSessionSecretForRequest();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, buildSessionToken(userId, sessionSecret), {
    httpOnly: true,
    secure: sessionCookieSecure(request),
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (!SESSION_TOKEN_RE.test(token)) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const sessionSecret = await resolveSessionSecretAsync();
  if (!sessionSecret) return null;

  const userId = verifySessionToken(token, sessionSecret);
  if (!userId) return null;

  const prisma = await getDb();
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
