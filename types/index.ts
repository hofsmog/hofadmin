import type { ComponentType } from "react";
import type { BillingStatus, OrganizationPlan, OrganizationRole, OrganizationSidebarStyle, OrganizationType } from "@/types/database";

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
  displayName: string | null;
  slug: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  sidebarStyle: OrganizationSidebarStyle;
  publicBrandingEnabled: boolean;
  customWelcomeMessage: string | null;
  supportEmail: string | null;
  websiteUrl: string | null;
  defaultLoanAgreementText: string;
  organizationType: OrganizationType | null;
  starterModules: string[];
  enabledModules: string[];
  publicRegistrationEnabled: boolean;
  defaultRegistrationRole: OrganizationRole;
  plan: OrganizationPlan;
  memberLimit: number | null;
  moduleLimit: number | null;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  customBrandingEnabled: boolean;
  emailNotificationsEnabled: boolean;
  onboardingChecklist: unknown;
  onboardingCompletedAt: string | null;
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
  | "loans"
  | "members"
  | "receipts"
  | "documents"
  | "issues"
  | "faultReports"
  | "keys"
  | "checklists"
  | "planner"
  | "dashboard"
  | "activity"
  | "branding"
  | "notifications"
  | "settings"
  | "assetLifecycle"
  | "onboarding"
  | "offboarding"
  | "policies"
  | "training"
  | "voting"
  | "budgets"
  | "vehicles"
  | "locations"
  | "events"
  | "announcements"
  | "projects"
  | "contracts"
  | "knowledgeBase"
  | "procurement"
  | "departments"
  | "timeTracking"
  | "sponsors"
  | "ideas"
  | "riskManagement"
  | "reporting"
  | "checkIns"
  | "tasks"
  | "lunch"
  | "visitors"
  | "equipment";

export type ModuleDefinition = {
  id: string;
  name: string;
  description: string;
  category: "Workspace" | "Operations" | "Admin";
  status: ModuleStatus;
  icon: ModuleIconKey;
  href?: string;
};

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};
