import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { signSessionToken, verifySessionToken } from "../src/lib/auth";

const TEST_SECRET = "test-session-secret-for-unit-tests";

describe("session token signing", () => {
  it("roundtrips a valid signed token", () => {
    const userId = "cltest123456789";
    const token = signSessionToken(userId, TEST_SECRET);
    expect(verifySessionToken(token, TEST_SECRET)).toBe(userId);
  });

  it("rejects a tampered userId", () => {
    const userId = "cltest123456789";
    const token = signSessionToken(userId, TEST_SECRET);
    const [, nonce, signature] = token.split(".");
    const forged = `clattacker999.${nonce}.${signature}`;
    expect(verifySessionToken(forged, TEST_SECRET)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signSessionToken("cltest123456789", TEST_SECRET);
    const parts = token.split(".");
    parts[2] = "0".repeat(64);
    expect(verifySessionToken(parts.join("."), TEST_SECRET)).toBeNull();
  });

  it("rejects legacy unsigned tokens (userId.uuid)", () => {
    const legacy = `cltest123456789.${randomUUID()}`;
    expect(verifySessionToken(legacy, TEST_SECRET)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = signSessionToken("cltest123456789", TEST_SECRET);
    expect(verifySessionToken(token, "other-secret")).toBeNull();
  });

  it("rejects empty and malformed tokens", () => {
    expect(verifySessionToken("", TEST_SECRET)).toBeNull();
    expect(verifySessionToken("only-one-part", TEST_SECRET)).toBeNull();
    expect(verifySessionToken("a.b.c.d", TEST_SECRET)).toBeNull();
  });
});
