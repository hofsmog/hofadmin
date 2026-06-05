import type { ModuleDefinition, Organization } from "@/types";

export const systemModuleIds = ["dashboard", "activity-feed", "branding", "notifications", "settings"] as const;

export const modules: ModuleDefinition[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Executive overview, attention cards, quick actions, and latest activity.",
    category: "Overview",
    status: "enabled",
    icon: "dashboard",
    href: "/dashboard",
  },
  {
    id: "forms",
    name: "Forms",
    description: "Create forms, collect responses, and manage an inbox-style workflow.",
    category: "Workspace",
    status: "enabled",
    icon: "forms",
    href: "/dashboard/forms",
  },
  {
    id: "surveys",
    name: "Surveys",
    description: "Create surveys and review response summaries inside Forms.",
    category: "Workspace",
    status: "enabled",
    icon: "surveys",
    href: "/dashboard/forms/create?type=survey",
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Track items, categories, QR codes, condition, location, and asset details.",
    category: "Operations",
    status: "enabled",
    icon: "inventory",
    href: "/dashboard/inventory",
  },
  {
    id: "loans",
    name: "Loans",
    description: "Manage active loans, returns, due dates, overdue items, signatures, and agreements.",
    category: "Operations",
    status: "enabled",
    icon: "loans",
    href: "/dashboard/inventory/loans",
  },
  {
    id: "members",
    name: "Members",
    description: "Manage member records, numbers, tags, status, notes, and attached documents.",
    category: "Engagement",
    status: "enabled",
    icon: "members",
    href: "/dashboard/members",
  },
  {
    id: "receipts",
    name: "Receipts",
    description: "Upload receipt files or mobile photos and keep searchable receipt records.",
    category: "Finance",
    status: "enabled",
    icon: "receipts",
    href: "/dashboard/receipts",
  },
  {
    id: "documents",
    name: "Documents",
    description: "Store organization documents and connect them to members or inventory items.",
    category: "Workspace",
    status: "enabled",
    icon: "documents",
    href: "/dashboard/documents",
  },
  {
    id: "issue-management",
    name: "Issue Management",
    description: "Create, assign, filter, and track internal issues from one place.",
    category: "Operations",
    status: "enabled",
    icon: "issues",
    href: "/dashboard/issues",
  },
  {
    id: "fault-reports",
    name: "Fault Reports",
    description: "Collect problem reports and turn them into trackable issues.",
    category: "Operations",
    status: "enabled",
    icon: "faultReports",
    href: "/dashboard/fault-reports",
  },
  {
    id: "bookings",
    name: "Bookings",
    description: "Book rooms, equipment, vehicles, keys, and shared resources.",
    category: "Facilities",
    status: "enabled",
    icon: "bookings",
    href: "/dashboard/bookings",
  },
  {
    id: "key-management",
    name: "Key Management",
    description: "Register keys, holders, return dates, lost keys, and handover history.",
    category: "Facilities",
    status: "enabled",
    icon: "keys",
    href: "/dashboard/keys",
  },
  {
    id: "checklists",
    name: "Checklists",
    description: "Create routine checklists, assign work, track due dates, and confirm completion.",
    category: "Operations",
    status: "enabled",
    icon: "checklists",
    href: "/dashboard/checklists",
  },
  {
    id: "visitor-management",
    name: "Visitor Management",
    description: "Check visitors in and out while keeping a simple visitor history.",
    category: "Facilities",
    status: "enabled",
    icon: "visitors",
    href: "/dashboard/visitors",
  },
  {
    id: "annual-planner",
    name: "Annual Planner",
    description: "Track recurring organizational tasks, deadlines, and responsibilities.",
    category: "Operations",
    status: "enabled",
    icon: "planner",
    href: "/dashboard/annual-planner",
  },
  {
    id: "qr-checkins",
    name: "Access & Attendance",
    description: "Reusable QR access points for attendance, visitors, forms, members, and assets.",
    category: "Operations",
    status: "enabled",
    icon: "qr",
    href: "/dashboard/qr",
  },
  {
    id: "activity-feed",
    name: "Activity Feed",
    description: "Review important activity and audit-friendly organization events.",
    category: "Administration",
    status: "enabled",
    icon: "activity",
    href: "/dashboard/audit-logs",
  },
  {
    id: "branding",
    name: "Branding",
    description: "Manage organization name, logo, colors, and public branding defaults.",
    category: "Administration",
    status: "enabled",
    icon: "branding",
    href: "/dashboard/settings",
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Configure email notification preferences for important events.",
    category: "Administration",
    status: "enabled",
    icon: "notifications",
    href: "/dashboard/settings",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Manage workspace settings, branding, inventory defaults, and notifications.",
    category: "Administration",
    status: "enabled",
    icon: "settings",
    href: "/dashboard/settings",
  },
];

export const defaultEnabledModuleIds = modules.filter((module) => module.status === "enabled").map((module) => module.id);

export function getEnabledModuleIds(organization: Pick<Organization, "starterModules">) {
  return organization.starterModules.length ? organization.starterModules : defaultEnabledModuleIds;
}

export function isModuleEnabled(moduleId: string, organization: Pick<Organization, "starterModules">) {
  return systemModuleIds.includes(moduleId as (typeof systemModuleIds)[number]) || getEnabledModuleIds(organization).includes(moduleId);
}

export function getModulesForOrganization(organization: Pick<Organization, "starterModules">) {
  const enabledIds = getEnabledModuleIds(organization);

  return modules.map((module) => ({
    ...module,
    status: systemModuleIds.includes(module.id as (typeof systemModuleIds)[number]) || enabledIds.includes(module.id) ? "enabled" as const : "disabled" as const,
  }));
}
