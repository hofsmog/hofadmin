import type { Organization } from "@/types";
import type { OrganizationPlan } from "@/types/database";

export type PlanLimit = number | null;

export type PlanDefinition = {
  id: OrganizationPlan;
  name: string;
  price: string;
  memberLimit: PlanLimit;
  moduleLimit: PlanLimit;
  description: string;
};

export const planDefinitions: Record<OrganizationPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0/mo",
    memberLimit: 50,
    moduleLimit: 2,
    description: "Start with the basics.",
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    memberLimit: 500,
    moduleLimit: 5,
    description: "For small teams replacing spreadsheets.",
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: "$99/mo",
    memberLimit: 2500,
    moduleLimit: null,
    description: "For growing teams that need every module.",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    memberLimit: null,
    moduleLimit: null,
    description: "For larger organizations with custom needs.",
  },
};

export const defaultEnabledModuleIdsByPlan: Record<OrganizationPlan, string[]> = {
  free: ["members", "forms"],
  starter: ["members", "forms", "inventory", "loans", "qr-checkins"],
  growth: [],
  enterprise: [],
};

export function getPlanDefinition(plan: OrganizationPlan) {
  return planDefinitions[plan] ?? planDefinitions.free;
}

export function getOrganizationPlan(organization: Pick<Organization, "plan">) {
  return getPlanDefinition(organization.plan ?? "free");
}

export function getEffectiveMemberLimit(
  organization: Pick<Organization, "plan" | "memberLimit">,
): PlanLimit {
  return organization.memberLimit ?? getOrganizationPlan(organization).memberLimit;
}

export function getEffectiveModuleLimit(
  organization: Pick<Organization, "plan" | "moduleLimit">,
): PlanLimit {
  return organization.moduleLimit ?? getOrganizationPlan(organization).moduleLimit;
}

export function formatLimit(limit: PlanLimit) {
  return limit === null ? "Unlimited" : String(limit);
}

export function formatUsage(current: number, limit: PlanLimit) {
  return limit === null ? `${current} / Unlimited` : `${current} / ${limit}`;
}

export function getMemberLimitMessage(
  organization: Pick<Organization, "plan" | "memberLimit">,
) {
  const plan = getOrganizationPlan(organization);
  const limit = getEffectiveMemberLimit(organization);

  if (limit === null) {
    return null;
  }

  return `You have reached the ${limit} member limit on the ${plan.name} plan.`;
}

export function getModuleLimitMessage(
  organization: Pick<Organization, "plan" | "moduleLimit">,
) {
  const limit = getEffectiveModuleLimit(organization);

  if (limit === null) {
    return null;
  }

  return `Your current plan includes ${limit} modules. Upgrade to enable more.`;
}
