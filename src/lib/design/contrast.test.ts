import { describe, expect, it } from "vitest";
import { contrastRatio, meetsWcagAa } from "./contrast";
import { CONTRAST_PAIRS } from "./tokens";

describe("design token contrast", () => {
  it.each(CONTRAST_PAIRS.map((p) => [p.name, p.fg, p.bg, p.min] as const))(
    "%s meets WCAG AA (≥%s:1)",
    (_name, fg, bg, min) => {
      expect(meetsWcagAa(fg, bg, min)).toBe(true);
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
    },
  );
});
