/** Flatten Error/cause chains for safe server-side matching (no secrets). */
export function collectErrorText(error: unknown, maxDepth = 8): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  let depth = 0;

  while (current && depth < maxDepth && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      if (current.message) parts.push(current.message);
      if ("code" in current && current.code) parts.push(String(current.code));
    } else if (typeof current === "string") {
      parts.push(current);
    } else if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      if (typeof record.message === "string") parts.push(record.message);
      if (record.code) parts.push(String(record.code));
    }
    current =
      current instanceof Error
        ? current.cause
        : typeof current === "object" && current && "cause" in current
          ? (current as { cause?: unknown }).cause
          : undefined;
    depth += 1;
  }

  return parts.join(" | ");
}
