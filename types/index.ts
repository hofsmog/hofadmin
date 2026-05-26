import type { ComponentType } from "react";

export type Role = "owner" | "admin" | "member" | "viewer";

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
  plan: "Starter" | "Scale" | "Enterprise";
  memberCount: number;
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
};

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};
