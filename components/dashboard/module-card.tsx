import type { ComponentType } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarRange,
  Car,
  CheckSquare,
  ClipboardList,
  Coffee,
  FileArchive,
  FileCheck2,
  FileSignature,
  GraduationCap,
  Handshake,
  Lightbulb,
  KeyRound,
  MapPin,
  Megaphone,
  Network,
  Package,
  PackageCheck,
  PiggyBank,
  QrCode,
  Receipt,
  ScanLine,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  UserMinus,
  UserPlus,
  UserCheck,
  UsersRound,
  Vote,
  Wrench,
} from "lucide-react";
import { openModuleAction, toggleModuleAction, updateModuleRolePermissionsAction } from "@/app/dashboard/modules/actions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { systemModuleIds } from "@/lib/modules";
import { cn } from "@/lib/utils";
import type { ModuleDefinition, ModuleIconKey } from "@/types";
import type { OrganizationRole } from "@/types/database";

const icons: Record<ModuleIconKey, ComponentType<{ className?: string }>> = {
  qr: QrCode,
  forms: ClipboardList,
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
  assetLifecycle: PackageCheck,
  onboarding: UserPlus,
  offboarding: UserMinus,
  policies: FileCheck2,
  training: GraduationCap,
  voting: Vote,
  budgets: PiggyBank,
  vehicles: Car,
  locations: MapPin,
  events: CalendarCheck,
  announcements: Megaphone,
  projects: Network,
  contracts: FileSignature,
  knowledgeBase: FileArchive,
  procurement: Receipt,
  departments: UsersRound,
  timeTracking: CalendarRange,
  sponsors: Handshake,
  ideas: Lightbulb,
  riskManagement: ShieldCheck,
  reporting: BarChart3,
  checkIns: ScanLine,
  tasks: SquareCheckBig,
  lunch: Coffee,
  visitors: UserCheck,
  equipment: Wrench,
};

export function ModuleCard({
  module,
  canManage = false,
  allowedRoles = ["owner", "admin", "member"],
}: {
  module: ModuleDefinition;
  canManage?: boolean;
  allowedRoles?: OrganizationRole[];
}) {
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
            {active ? "Active" : "Disabled"}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-lg">{module.name}</CardTitle>
          <CardDescription className="mt-2">{module.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Badge>{module.category}</Badge>
          {canManage && active ? (
            <form action={updateModuleRolePermissionsAction} className="mt-3 space-y-2">
              <input type="hidden" name="moduleId" value={module.id} />
              <input type="hidden" name="returnTo" value="/dashboard/modules?updated=1" />
              <p className="text-xs font-medium text-muted-foreground">Allowed roles</p>
              <div className="flex flex-wrap gap-2">
                {(["owner", "admin", "member"] as OrganizationRole[]).map((role) => (
                  <label key={role} className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs capitalize">
                    <input type="checkbox" name={`role:${role}`} defaultChecked={allowedRoles.includes(role)} />
                    {role}
                  </label>
                ))}
              </div>
              <Button type="submit" variant="secondary" className="h-8 px-3 text-xs">
                Save access
              </Button>
            </form>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
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
