"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({
  show,
  tone = "success",
  title,
  message,
}: {
  show: boolean;
  tone?: "success" | "error";
  title: string;
  message?: string;
}) {
  if (!show) {
    return null;
  }

  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in rounded-xl border bg-white p-4 text-zinc-950 shadow-2xl shadow-zinc-950/10 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex gap-3">
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            tone === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {message ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
