import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/[0.05] dark:hover:shadow-black/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{detail}</p>
    </Card>
  );
}
