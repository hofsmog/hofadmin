import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300",
        className,
      )}
      {...props}
    />
  );
}
