import {
  Activity,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Puzzle,
  QrCode,
  Settings,
  UsersRound,
  Package,
  FileArchive,
  Receipt,
  AlertCircle,
  CalendarDays,
  CheckSquare,
  KeyRound,
  UserCheck,
  CalendarRange,
} from "lucide-react";
import { isModuleEnabled } from "@/lib/modules";
import type { DashboardNavItem, Organization } from "@/types";

export const dashboardNavItems: Array<DashboardNavItem & { moduleId?: string; system?: boolean }> = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, moduleId: "dashboard", system: true },
  { title: "Access & Attendance", href: "/dashboard/qr", icon: QrCode, moduleId: "qr-checkins" },
  { title: "Forms", href: "/dashboard/forms", icon: ClipboardList, moduleId: "forms" },
  { title: "Members", href: "/dashboard/members", icon: UsersRound, moduleId: "members" },
  { title: "Inventory", href: "/dashboard/inventory", icon: Package, moduleId: "inventory" },
  { title: "Documents", href: "/dashboard/documents", icon: FileArchive, moduleId: "documents" },
  { title: "Receipts", href: "/dashboard/receipts", icon: Receipt, moduleId: "receipts" },
  { title: "Issue Management", href: "/dashboard/issues", icon: AlertCircle, moduleId: "issue-management" },
  { title: "Fault Reports", href: "/dashboard/fault-reports", icon: ClipboardList, moduleId: "fault-reports" },
  { title: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, moduleId: "bookings" },
  { title: "Key Management", href: "/dashboard/keys", icon: KeyRound, moduleId: "key-management" },
  { title: "Checklists", href: "/dashboard/checklists", icon: CheckSquare, moduleId: "checklists" },
  { title: "Visitor Management", href: "/dashboard/visitors", icon: UserCheck, moduleId: "visitor-management" },
  { title: "Annual Planner", href: "/dashboard/annual-planner", icon: CalendarRange, moduleId: "annual-planner" },
  { title: "Modules", href: "/dashboard/modules", icon: Puzzle, system: true },
  { title: "Organizations", href: "/dashboard/organizations", icon: Building2, system: true },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, moduleId: "settings", system: true },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard, system: true },
  { title: "Activity Feed", href: "/dashboard/audit-logs", icon: Activity, moduleId: "activity-feed", system: true },
];

export function getDashboardNavItems(organization: Pick<Organization, "starterModules">) {
  return dashboardNavItems.filter((item) => item.system || !item.moduleId || isModuleEnabled(item.moduleId, organization));
}
