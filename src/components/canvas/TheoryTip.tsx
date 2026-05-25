"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import {
  theoryGlossary,
  type GlossaryTerm,
} from "@/lib/theory-glossary";
import { cn } from "@/lib/cn";

export function TheoryTip({
  term,
  className,
}: {
  term: GlossaryTerm;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const entry = theoryGlossary[term];
  if (!entry) return null;

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className="min-h-8 min-w-8 flex items-center justify-center rounded-sm text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-rule"
        aria-label={`${entry.title} 说明`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span role="tooltip" className="theory-tip-popover">
          <strong className="font-serif text-sm text-ink block">{entry.title}</strong>
          <p className="mt-1 text-ink-muted leading-relaxed">{entry.excerpt}</p>
          <Link
            href={`/guide#${entry.anchor}`}
            className="mt-2 inline-block text-accent no-underline hover:underline text-xs"
          >
            查看完整说明
          </Link>
        </span>
      )}
    </span>
  );
}
