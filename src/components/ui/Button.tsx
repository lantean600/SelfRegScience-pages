import { cn } from "@/lib/cn";
import { shouldPrefetchHref } from "@/lib/motion/app-routes";
import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

export const buttonVariants = {
  primary:
    "bg-accent text-accent-fg border border-accent hover:translate-y-[-1px] hover:brightness-105",
  secondary:
    "bg-panel text-ink border border-rule-strong hover:bg-paper hover:translate-y-[-1px]",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-panel hover:border-rule",
  danger: "bg-signal text-signal-fg border border-signal hover:translate-y-[-1px]",
  link: "bg-transparent text-accent border-0 underline-offset-4 hover:underline p-0 min-h-0",
  editorial:
    "bg-panel text-ink border border-rule-strong hover:bg-paper hover:translate-y-[-1px] shadow-[var(--shadow-figure)]",
  masthead:
    "bg-transparent text-ink border-0 border-b border-transparent hover:border-rule-strong rounded-none px-0 min-h-0 font-serif",
  rail: "bg-transparent text-ink border border-rule hover:bg-panel hover:border-rule-strong",
};

export const buttonSizes = {
  sm: "min-h-9 px-3.5 text-xs",
  md: "min-h-11 px-4.5 text-sm",
  lg: "min-h-12 px-5.5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  href?: string;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  href,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-sm font-medium tracking-[0.01em] transition-[transform,filter,background-color,border-color,color] duration-200 disabled:opacity-50 disabled:pointer-events-none",
    buttonVariants[variant],
    variant !== "link" && variant !== "masthead" && buttonSizes[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} prefetch={shouldPrefetchHref(href)} className={classes}>
        {props.children}
      </Link>
    );
  }

  return <button type={type} className={classes} {...props} />;
}
