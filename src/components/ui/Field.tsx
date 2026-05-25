import { cn } from "@/lib/cn";
import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-kicker block mb-2", className)}
      {...props}
    />
  );
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-2 text-xs text-ink-muted/90 leading-relaxed", className)} {...props} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full min-h-12 rounded-sm border border-rule bg-panel/90 px-4 text-sm text-ink shadow-[var(--shadow-panel)] transition-[border-color,background-color,transform]",
        "placeholder:text-ink-muted/70",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent hover:border-rule-strong/30 focus-visible:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full min-h-12 rounded-sm border border-rule bg-panel/90 px-4 text-sm text-ink shadow-[var(--shadow-panel)] transition-[border-color,background-color]",
        "hover:border-rule-strong/30 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent focus-visible:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-h-28 rounded-sm border border-rule bg-panel/90 px-4 py-3 text-sm text-ink shadow-[var(--shadow-panel)] resize-y transition-[border-color,background-color]",
        "hover:border-rule-strong/30 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent focus-visible:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {label && <Label>{label}</Label>}
      {children}
      {error && <Hint className="text-signal">{error}</Hint>}
      {hint && !error && <Hint>{hint}</Hint>}
    </div>
  );
}
