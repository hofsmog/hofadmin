import type { ModuleDefinition, Organization } from "@/types";
import { defaultEnabledModuleIdsByPlan, getEffectiveModuleLimit } from "@/lib/plans";

export const systemModuleIds = ["dashboard", "activity-feed", "branding", "notifications", "settings"] as const;

export const modules: ModuleDefinition[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Your daily overview, quick actions, and latest activity.",
    category: "Admin",
    status: "enabled",
    icon: "dashboard",
    href: "/dashboard",
  },
  {
    id: "forms",
    name: "Forms",
    description: "Create forms and surveys, collect responses, and review results.",
    category: "Workspace",
    status: "enabled",
    icon: "forms",
    href: "/dashboard/forms",
  },
  {
    id: "members",
    name: "Members",
    description: "Keep students, members, staff, or participants organized.",
    category: "Workspace",
    status: "enabled",
    icon: "members",
    href: "/dashboard/members",
  },
  {
    id: "sponsors",
    name: "Sponsors",
    description: "Track sponsors, partners, agreements, and renewals.",
    category: "Workspace",
    status: "enabled",
    icon: "sponsors",
    href: "/dashboard/sponsors",
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Track items, equipment, status, and availability.",
    category: "Operations",
    status: "enabled",
    icon: "inventory",
    href: "/dashboard/inventory",
  },
  {
    id: "loans",
    name: "Loans",
    description: "Manage borrowers, returns, due dates, and agreements.",
    category: "Operations",
    status: "enabled",
    icon: "loans",
    href: "/dashboard/inventory/loans",
  },
  {
    id: "bookings",
    name: "Bookings",
    description: "Reserve rooms, equipment, and shared resources.",
    category: "Operations",
    status: "enabled",
    icon: "bookings",
    href: "/dashboard/bookings",
  },
  {
    id: "qr-checkins",
    name: "Attendance & Check-ins",
    description: "Track attendance with simple QR check-in points.",
    category: "Operations",
    status: "enabled",
    icon: "qr",
    href: "/dashboard/qr",
  },
  {
    id: "activity-feed",
    name: "Activity Feed",
    description: "Review important organization activity.",
    category: "Admin",
    status: "enabled",
    icon: "activity",
    href: "/dashboard/audit-logs",
  },
  {
    id: "branding",
    name: "Branding",
    description: "Manage organization name, logo, colors, and public branding.",
    category: "Admin",
    status: "enabled",
    icon: "branding",
    href: "/dashboard/settings",
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Configure email preferences for important updates.",
    category: "Admin",
    status: "enabled",
    icon: "notifications",
    href: "/dashboard/settings",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Manage workspace settings and defaults.",
    category: "Admin",
    status: "enabled",
    icon: "settings",
    href: "/dashboard/settings",
  },
];

export const defaultEnabledModuleIds = modules.filter((module) => module.status === "enabled").map((module) => module.id);
export const userManagedModuleIds = modules
  .filter((module) => !systemModuleIds.includes(module.id as (typeof systemModuleIds)[number]))
  .map((module) => module.id);

export function getDefaultEnabledModuleIdsForOrganization(
  organization: Pick<Organization, "plan" | "moduleLimit">,
) {
  return organization.plan === "growth" || organization.plan === "enterprise"
    ? userManagedModuleIds
    : defaultEnabledModuleIdsByPlan[organization.plan];
}

export function getEnabledModuleIds(
  organization: Pick<Organization, "plan" | "moduleLimit" | "enabledModules" | "starterModules">,
) {
  const configuredModuleIds = organization.enabledModules.length
    ? organization.enabledModules
    : getDefaultEnabledModuleIdsForOrganization(organization);
  const moduleLimit = getEffectiveModuleLimit(organization);
  const selectableConfiguredModuleIds = configuredModuleIds.filter((moduleId) => userManagedModuleIds.includes(moduleId));

  return moduleLimit === null
    ? selectableConfiguredModuleIds
    : selectableConfiguredModuleIds.slice(0, moduleLimit);
}

export function getSelectableEnabledModuleIds(
  organization: Pick<Organization, "plan" | "moduleLimit" | "enabledModules" | "starterModules">,
) {
  return getEnabledModuleIds(organization).filter((moduleId) =>
    userManagedModuleIds.includes(moduleId),
  );
}

export function isModuleEnabled(moduleId: string, organization: Pick<Organization, "plan" | "moduleLimit" | "enabledModules" | "starterModules">) {
  return systemModuleIds.includes(moduleId as (typeof systemModuleIds)[number]) || getEnabledModuleIds(organization).includes(moduleId);
}

export function getModulesForOrganization(organization: Pick<Organization, "plan" | "moduleLimit" | "enabledModules" | "starterModules">) {
  const enabledIds = getEnabledModuleIds(organization);

  return modules.map((module) => ({
    ...module,
    status: systemModuleIds.includes(module.id as (typeof systemModuleIds)[number]) || enabledIds.includes(module.id) ? "enabled" as const : "disabled" as const,
  }));
}
