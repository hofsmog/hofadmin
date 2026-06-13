import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, OrganizationRole } from "@/types/database";
import type { Organization, OrganizationContext } from "@/types";

const activeOrganizationCookie = "hofadmin_active_organization_id";

type Supabase = SupabaseClient<Database>;
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type MembershipRow = Database["public"]["Tables"]["organization_members"]["Row"];
type InvitationAcceptanceRpcClient = Supabase & {
  rpc(
    fn: "accept_organization_invitation_by_token",
    args: { p_token: string },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
  rpc(
    fn: "accept_organization_invitation",
    args: { p_invitation_id: string },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
};

export function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    slug: row.slug,
    avatarUrl: row.avatar_url,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    accentColor: row.accent_color,
    backgroundColor: row.background_color,
    sidebarStyle: row.sidebar_style,
    publicBrandingEnabled: row.public_branding_enabled,
    customWelcomeMessage: row.custom_welcome_message,
    supportEmail: row.support_email,
    websiteUrl: row.website_url,
    defaultLoanAgreementText: row.default_loan_agreement_text,
    organizationType: row.organization_type,
    starterModules: row.starter_modules,
    enabledModules: row.enabled_modules ?? row.starter_modules ?? [],
    publicRegistrationEnabled: row.public_registration_enabled ?? true,
    defaultRegistrationRole: row.default_registration_role ?? "member",
    plan: row.plan ?? "free",
    memberLimit: row.member_limit ?? null,
    moduleLimit: row.module_limit ?? null,
    billingStatus: row.billing_status ?? "none",
    trialEndsAt: row.trial_ends_at,
    customBrandingEnabled: row.custom_branding_enabled ?? false,
    emailNotificationsEnabled: row.email_notifications_enabled ?? false,
    onboardingChecklist: row.onboarding_checklist,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canManageMembers(role: OrganizationRole) {
  return role === "owner" || role === "admin";
}

export function canManageOrganization(role: OrganizationRole) {
  return role === "owner" || role === "admin";
}

export async function getOrganizationContext(
  supabase: Supabase,
  user: User,
): Promise<OrganizationContext> {
  const memberships = await getMemberships(supabase, user);
  const ensuredMemberships =
    memberships.length > 0 ? memberships : await getFallbackMemberships(supabase, user);

  const organizationIds = ensuredMemberships.map((membership) => membership.organization_id);
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")
    .in("id", organizationIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!organizations?.length) {
    throw new Error("No organizations are available for this account.");
  }

  const cookieStore = await cookies();
  const preferredOrganizationId = cookieStore.get(activeOrganizationCookie)?.value;
  const activeOrganization =
    organizations.find((organization) => organization.id === preferredOrganizationId) ?? organizations[0];
  const activeMembership =
    ensuredMemberships.find((membership) => membership.organization_id === activeOrganization.id) ??
    ensuredMemberships[0];

  return {
    activeOrganization: mapOrganization(activeOrganization),
    activeMembership: {
      organizationId: activeMembership.organization_id,
      userId: activeMembership.user_id,
      role: activeMembership.role,
      joinedAt: activeMembership.joined_at,
    },
    organizations: organizations.map((organization) => ({
      ...mapOrganization(organization),
      role:
        ensuredMemberships.find((membership) => membership.organization_id === organization.id)?.role ??
        "member",
    })),
  };
}

export async function setActiveOrganizationCookie(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(activeOrganizationCookie, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
}

export async function createOrganizationForUser(
  supabase: Supabase,
  user: User,
  name: string,
  avatarUrl?: string | null,
) {
  const organizationName = sanitizeOrganizationName(name);
  const slug = createSlug(organizationName);
  const { data: organization, error } = await supabase.rpc("create_organization_with_owner", {
    org_name: organizationName,
    org_slug: `${slug}-${crypto.randomUUID().slice(0, 8)}`,
    org_avatar_url: avatarUrl ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!organization) {
    throw new Error("Organization could not be created.");
  }

  await setActiveOrganizationCookie(organization.id);

  return organization;
}

async function getMemberships(supabase: Supabase, user: User) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getFallbackMemberships(supabase: Supabase, user: User): Promise<MembershipRow[]> {
  const invitationOrganizationId = await acceptPendingInvitationFromMetadata(supabase, user);

  if (invitationOrganizationId) {
    const memberships = await getMemberships(supabase, user);

    if (memberships.length > 0) {
      return memberships;
    }

    console.error("[organization-context] Invitation acceptance returned an organization but no membership was found.", {
      userId: user.id,
      organizationId: invitationOrganizationId,
    });
  }

  console.warn("[organization-context] No organization membership found; creating initial workspace.", {
    userId: user.id,
    email: user.email,
    hadInvitationToken: Boolean(getInvitationTokenFromMetadata(user)),
  });

  return [await createInitialOrganization(supabase, user)];
}

async function acceptPendingInvitationFromMetadata(supabase: Supabase, user: User) {
  const invitationToken = getInvitationTokenFromMetadata(user);

  if (!invitationToken) {
    return null;
  }

  const rpc = supabase as InvitationAcceptanceRpcClient;
  const { data: organizationId, error } = await rpc.rpc("accept_organization_invitation_by_token", {
    p_token: invitationToken,
  });

  if (organizationId && !error) {
    await setActiveOrganizationCookie(organizationId);
    console.info("[organization-context] Accepted pending token invitation from user metadata.", {
      userId: user.id,
      organizationId,
    });
    return organizationId;
  }

  if (isUuid(invitationToken)) {
    const { data: legacyOrganizationId, error: legacyError } = await rpc.rpc("accept_organization_invitation", {
      p_invitation_id: invitationToken,
    });

    if (legacyOrganizationId && !legacyError) {
      await setActiveOrganizationCookie(legacyOrganizationId);
      console.info("[organization-context] Accepted pending legacy invitation from user metadata.", {
        userId: user.id,
        organizationId: legacyOrganizationId,
      });
      return legacyOrganizationId;
    }

    console.warn("[organization-context] Legacy invitation metadata could not be accepted.", {
      userId: user.id,
      invitationId: invitationToken,
      error: legacyError?.message ?? error?.message,
    });
    return null;
  }

  console.warn("[organization-context] Token invitation metadata could not be accepted.", {
    userId: user.id,
    error: error?.message,
  });
  return null;
}

async function createInitialOrganization(supabase: Supabase, user: User): Promise<MembershipRow> {
  const metadataName = user.user_metadata?.organization_name;
  const fallbackName =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName
      : `${user.email?.split("@")[0] ?? "HofAdmin"} Workspace`;
  const organization = await createOrganizationForUser(supabase, user, fallbackName);

  return {
    organization_id: organization.id,
    user_id: user.id,
    role: "owner",
    invited_by: null,
    joined_at: new Date().toISOString(),
  };
}

function getInvitationTokenFromMetadata(user: User) {
  const token = user.user_metadata?.invitation_token;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function sanitizeOrganizationName(name: string) {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    throw new Error("Organization name must be at least 2 characters.");
  }

  if (trimmed.length > 80) {
    throw new Error("Organization name must be 80 characters or fewer.");
  }

  return trimmed;
}

export function createSlug(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "organization";
}
