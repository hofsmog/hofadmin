import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  Puzzle,
  Settings,
  UsersRound,
} from "lucide-react";
import type { DashboardNavItem } from "@/types";

export const dashboardNavItems: DashboardNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Organizations", href: "/dashboard/organizations", icon: Building2 },
  { title: "Team Members", href: "/dashboard/team", icon: UsersRound },
  { title: "Modules", href: "/dashboard/modules", icon: Puzzle },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: Activity },
];
