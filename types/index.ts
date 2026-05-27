import type { ComponentType } from "react";
import type { OrganizationRole } from "@/types/database";

export type Role = OrganizationRole;

export type Permission =
  | "organization:read"
  | "organization:update"
  | "team:manage"
  | "modules:manage"
  | "billing:manage"
  | "audit:read";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrganizationMembership = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: string;
};

export type OrganizationContext = {
  activeOrganization: Organization;
  activeMembership: OrganizationMembership;
  organizations: Array<Organization & { role: OrganizationRole }>;
};

export type ModuleStatus = "enabled" | "disabled";
export type ModuleIconKey =
  | "qr"
  | "forms"
  | "bookings"
  | "inventory"
  | "members"
  | "checkIns";

export type ModuleDefinition = {
  id: string;
  name: string;
  description: string;
  category: "Operations" | "Engagement" | "Commerce" | "Workspace";
  status: ModuleStatus;
  icon: ModuleIconKey;
  href?: string;
};

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};
