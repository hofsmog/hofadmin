"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { checked: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-zinc-950",
        checked ? "border-zinc-950 bg-zinc-950 dark:border-zinc-100 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-zinc-950",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
