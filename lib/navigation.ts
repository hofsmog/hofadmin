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
} from "lucide-react";
import type { DashboardNavItem } from "@/types";

export const dashboardNavItems: DashboardNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "QR + Check-ins", href: "/dashboard/qr", icon: QrCode },
  { title: "Forms", href: "/dashboard/forms", icon: ClipboardList },
  { title: "Members", href: "/dashboard/members", icon: UsersRound },
  { title: "Modules", href: "/dashboard/modules", icon: Puzzle },
  { title: "Organizations", href: "/dashboard/organizations", icon: Building2 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: Activity },
];
