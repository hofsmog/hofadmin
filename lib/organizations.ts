import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, OrganizationRole } from "@/types/database";
import type { Organization, OrganizationContext } from "@/types";

const activeOrganizationCookie = "hofadmin_active_organization_id";

type Supabase = SupabaseClient<Database>;
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type MembershipRow = Database["public"]["Tables"]["organization_members"]["Row"];

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
    memberships.length > 0 ? memberships : [await createInitialOrganization(supabase, user)];

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
