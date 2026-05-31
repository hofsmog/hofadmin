import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { handlingStatusLabels, readStatusLabels } from "@/lib/forms/submissions";
import type { FormSubmissionHandlingStatus, FormSubmissionReadStatus } from "@/types/database";

const handlingClassNames: Record<FormSubmissionHandlingStatus, string> = {
  unhandled: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  partially_handled: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  handled: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
};

export function ReadStatusBadge({ status }: { status: FormSubmissionReadStatus }) {
  return (
    <Badge
      className={cn(
        status === "new"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
      )}
    >
      {status === "new" ? <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
      {readStatusLabels[status]}
    </Badge>
  );
}

export function HandlingStatusBadge({ status }: { status: FormSubmissionHandlingStatus }) {
  return <Badge className={cn(handlingClassNames[status])}>{handlingStatusLabels[status]}</Badge>;
}
