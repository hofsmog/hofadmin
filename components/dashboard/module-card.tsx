import type { ComponentType } from "react";
import {
  CalendarCheck,
  ClipboardList,
  Coffee,
  HardHat,
  Package,
  QrCode,
  ScanLine,
  SquareCheckBig,
  UsersRound,
} from "lucide-react";
import { openModuleAction } from "@/app/dashboard/modules/actions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ModuleDefinition, ModuleIconKey } from "@/types";

const icons: Record<ModuleIconKey, ComponentType<{ className?: string }>> = {
  qr: QrCode,
  forms: ClipboardList,
  bookings: CalendarCheck,
  inventory: Package,
  members: UsersRound,
  checkIns: ScanLine,
  tasks: SquareCheckBig,
  lunch: Coffee,
  visitors: HardHat,
  equipment: HardHat,
};

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  const Icon = icons[module.icon];
  const active = module.status === "enabled";

  return (
    <Card className="group flex min-h-72 flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/[0.06] dark:hover:shadow-black/30">
      <CardHeader className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "grid h-12 w-12 place-items-center rounded-xl border shadow-sm transition",
              active
                ? "bg-zinc-950 text-white group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-950"
                : "bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <Badge
            className={cn(
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
            )}
          >
            {active ? "Active" : "Coming soon"}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-lg">{module.name}</CardTitle>
          <CardDescription className="mt-2">{module.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <Badge>{module.category}</Badge>
        {module.href && active ? (
          <form action={openModuleAction}>
            <input type="hidden" name="moduleId" value={module.id} />
            <Button type="submit" className="h-9 px-3">
              Open
            </Button>
          </form>
        ) : module.href ? (
          <ButtonLink href={module.href} variant="secondary" className="h-9 px-3">
            Preview
          </ButtonLink>
        ) : (
          <Button type="button" variant="secondary" className="h-9 px-3" disabled>
            Notify me
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
