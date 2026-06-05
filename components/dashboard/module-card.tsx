import type { ComponentType } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarCheck,
  CalendarRange,
  ChartBar,
  CheckSquare,
  ClipboardList,
  Coffee,
  FileArchive,
  KeyRound,
  Package,
  QrCode,
  Receipt,
  ScanLine,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { openModuleAction, toggleModuleAction } from "@/app/dashboard/modules/actions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { systemModuleIds } from "@/lib/modules";
import { cn } from "@/lib/utils";
import type { ModuleDefinition, ModuleIconKey } from "@/types";

const icons: Record<ModuleIconKey, ComponentType<{ className?: string }>> = {
  qr: QrCode,
  forms: ClipboardList,
  surveys: ChartBar,
  bookings: CalendarCheck,
  inventory: Package,
  loans: ScanLine,
  members: UsersRound,
  receipts: Receipt,
  documents: FileArchive,
  issues: AlertCircle,
  faultReports: ClipboardList,
  keys: KeyRound,
  checklists: CheckSquare,
  planner: CalendarRange,
  dashboard: SquareCheckBig,
  activity: Activity,
  branding: ShieldCheck,
  notifications: Bell,
  settings: Settings,
  checkIns: ScanLine,
  tasks: SquareCheckBig,
  lunch: Coffee,
  visitors: UserCheck,
  equipment: Package,
};

export function ModuleCard({ module, canManage = false }: { module: ModuleDefinition; canManage?: boolean }) {
  const Icon = icons[module.icon];
  const active = module.status === "enabled";
  const locked = systemModuleIds.includes(module.id as (typeof systemModuleIds)[number]);

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
        <div className="flex gap-2">
          {canManage && !locked ? (
            <form action={toggleModuleAction}>
              <input type="hidden" name="moduleId" value={module.id} />
              <input type="hidden" name="enabled" value={active ? "false" : "true"} />
              <Button type="submit" variant="secondary" className="h-9 px-3">
                {active ? "Disable" : "Enable"}
              </Button>
            </form>
          ) : null}
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
              Unavailable
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
