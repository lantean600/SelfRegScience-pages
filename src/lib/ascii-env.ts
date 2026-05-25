/** HTTP headers / cookies on Workers only allow Latin-1 (ByteString). */
const ASCII_PRINTABLE = /^[\x21-\x7E]+$/;

export function assertAsciiEnv(name: string, value: string): string {
  const trimmed = value.trim();
  if (!ASCII_PRINTABLE.test(trimmed)) {
    throw new Error(
      `${name} must contain only ASCII characters (letters, numbers, symbols). ` +
        "Remove Chinese text, smart quotes, or extra labels copied from docs.",
    );
  }
  return trimmed;
}

export function stripBearerPrefix(value: string): string {
  return value.replace(/^Bearer\s+/i, "").trim();
}
