import {
  ClipboardList,
  FileArchive,
  LayoutDashboard,
  Puzzle,
  Settings,
  UsersRound,
} from "lucide-react";
import type { ModulePermissionRow } from "@/lib/module-permissions";
import type { DashboardNavItem, Organization } from "@/types";
import type { OrganizationRole } from "@/types/database";

export const dashboardNavItems: Array<DashboardNavItem & { moduleId?: string; system?: boolean }> = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, moduleId: "dashboard", system: true },
  { title: "Members & Teams", href: "/dashboard/members", icon: UsersRound, moduleId: "members", system: true },
  { title: "Forms", href: "/dashboard/forms", icon: ClipboardList, moduleId: "forms" },
  { title: "Documents", href: "/dashboard/documents", icon: FileArchive, moduleId: "documents" },
  { title: "Modules", href: "/dashboard/modules", icon: Puzzle, system: true },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, moduleId: "settings", system: true },
];

export function getDashboardNavItems(
  organization: Pick<Organization, "plan" | "moduleLimit" | "enabledModules" | "starterModules">,
  access?: {
    role: OrganizationRole;
    permissionRows: ModulePermissionRow[];
  },
) {
  void organization;
  void access;

  return dashboardNavItems;
}
