import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

const cardVariants = {
  default: "rounded-sm border border-rule bg-panel/50",
  narrative: "bg-transparent border-0",
  stat: "border-l-2 border-editorial pl-4",
  figure: "border border-rule bg-figure-bg",
};

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof cardVariants }) {
  return <div className={cn(cardVariants[variant], className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-0 pt-0 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-display uppercase text-ink tracking-tight leading-none", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1.5 text-sm text-ink-muted font-sans leading-relaxed", className)} {...props} />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-0 pb-0", className)} {...props} />;
}

export function FigureFrame({
  caption,
  aside,
  children,
  className,
}: {
  caption: string;
  aside?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={className}>
      <figcaption className="flex justify-between items-baseline border-b border-rule pb-2 mb-3">
        <span className="section-marker">{caption}</span>
        {aside && <span className="text-caption opacity-60">{aside}</span>}
      </figcaption>
      <div className="border border-rule bg-figure-bg relative min-h-[200px]">{children}</div>
    </figure>
  );
}
