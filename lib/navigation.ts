import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileArchive,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Puzzle,
  QrCode,
  Settings,
  UsersRound,
  Package,
} from "lucide-react";
import { isModuleEnabled } from "@/lib/modules";
import { canRoleAccessModule, type ModulePermissionRow } from "@/lib/module-permissions";
import type { DashboardNavItem, Organization } from "@/types";
import type { OrganizationRole } from "@/types/database";

export const dashboardNavItems: Array<DashboardNavItem & { moduleId?: string; system?: boolean }> = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, moduleId: "dashboard", system: true },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare, system: true },
  { title: "Members", href: "/dashboard/members", icon: UsersRound, moduleId: "members" },
  { title: "Forms", href: "/dashboard/forms", icon: ClipboardList, moduleId: "forms" },
  { title: "Documents", href: "/dashboard/documents", icon: FileArchive, moduleId: "documents" },
  { title: "Inventory", href: "/dashboard/inventory", icon: Package, moduleId: "inventory" },
  { title: "Loans", href: "/dashboard/inventory/loans", icon: Package, moduleId: "loans" },
  { title: "Attendance & Check-ins", href: "/dashboard/qr", icon: QrCode, moduleId: "qr-checkins" },
  { title: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, moduleId: "bookings" },
  { title: "Issues", href: "/dashboard/issues", icon: ClipboardList, moduleId: "issues" },
  { title: "Sponsors", href: "/dashboard/sponsors", icon: Handshake, moduleId: "sponsors" },
  { title: "Modules", href: "/dashboard/modules", icon: Puzzle, system: true },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, moduleId: "settings", system: true },
  { title: "Activity Feed", href: "/dashboard/audit-logs", icon: Activity, moduleId: "activity-feed", system: true },
];

export function getDashboardNavItems(
  organization: Pick<Organization, "plan" | "moduleLimit" | "enabledModules" | "starterModules">,
  access?: {
    role: OrganizationRole;
    permissionRows: ModulePermissionRow[];
  },
) {
  return dashboardNavItems.filter((item) => {
    if (!item.moduleId) {
      return true;
    }

    if (!isModuleEnabled(item.moduleId, organization)) {
      return false;
    }

    if (!access || item.system) {
      return true;
    }

    return canRoleAccessModule({
      moduleId: item.moduleId,
      role: access.role,
      organization: organization as Organization,
      permissionRows: access.permissionRows,
    });
  });
}
