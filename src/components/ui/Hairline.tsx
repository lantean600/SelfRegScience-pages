import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

export function Hairline({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn("border-0 border-t border-rule my-6", className)}
      {...props}
    />
  );
}
