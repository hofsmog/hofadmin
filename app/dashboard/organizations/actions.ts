"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  canManageMembers,
  canManageOrganization,
  createOrganizationForUser,
  getOrganizationContext,
  sanitizeOrganizationName,
  setActiveOrganizationCookie,
} from "@/lib/organizations";
import type { OrganizationRole, OrganizationType } from "@/types/database";

const validRoles = new Set<OrganizationRole>(["owner", "admin", "member"]);
const validOrganizationTypes = new Set<OrganizationType>(["school", "club", "business", "restaurant", "cafe", "event", "other"]);

export type OrganizationBrandingState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function switchOrganizationAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("You do not have access to that organization.");
  }

  await setActiveOrganizationCookie(organizationId);
}

export async function createOrganizationAction(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const name = String(formData.get("name") || "");
  const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;

  await createOrganizationForUser(supabase, user, name, avatarUrl);
  revalidatePath("/dashboard");
}

export async function updateOrganizationAction(formData: FormData) {
  await updateOrganization(formData);
}

export async function updateOrganizationBrandingAction(
  _state: OrganizationBrandingState,
  formData: FormData,
): Promise<OrganizationBrandingState> {
  try {
    await updateOrganization(formData);
    return { status: "success", message: "Organization branding saved." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Branding could not be saved.",
    };
  }
}

async function updateOrganization(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const context = await getOrganizationContext(supabase, user);

  if (!canManageOrganization(context.activeMembership.role)) {
    throw new Error("You do not have permission to update this organization.");
  }

  const name = sanitizeOrganizationName(String(formData.get("name") || ""));
  const displayName = sanitizeOptionalDisplayName(String(formData.get("displayName") || ""));
  const organizationType = sanitizeOrganizationType(String(formData.get("organizationType") || ""));
  const logoUrl = String(formData.get("logoUrl") || "").trim() || null;
  const fallbackAvatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
  const avatarUrl = logoUrl ?? fallbackAvatarUrl;
  const accentColor = sanitizeAccentColor(String(formData.get("accentColor") || ""));

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      display_name: displayName,
      organization_type: organizationType,
      avatar_url: avatarUrl,
      logo_url: logoUrl,
      accent_color: accentColor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.activeOrganization.id);

  if (error) {
    throw new Error(error.message);
  }

  await recordActivityEvent({
    supabase,
    organizationId: context.activeOrganization.id,
    type: "organization_updated",
    title: "Organization updated",
    description: `${displayName ?? name} branding settings were updated.`,
    actorId: user.id,
    metadata: {
      logoChanged: logoUrl !== context.activeOrganization.logoUrl,
      accentColor,
      organizationType,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

function sanitizeOptionalDisplayName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new Error("Display name must be between 2 and 80 characters.");
  }

  return trimmed;
}

function sanitizeAccentColor(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    throw new Error("Accent color must be a valid hex color like #2563eb.");
  }

  return trimmed;
}

function sanitizeOrganizationType(value: string) {
  const trimmed = value.trim() as OrganizationType;

  if (!trimmed) {
    return null;
  }

  if (!validOrganizationTypes.has(trimmed)) {
    throw new Error("Choose a valid organization type.");
  }

  return trimmed;
}

export async function inviteMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const context = await getOrganizationContext(supabase, user);

  if (!canManageMembers(context.activeMembership.role)) {
    throw new Error("You do not have permission to invite members.");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "member") as OrganizationRole;

  if (!email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (!validRoles.has(role) || role === "owner") {
    throw new Error("Invited members can be admin or member.");
  }

  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: context.activeOrganization.id,
    email,
    role,
    invited_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordActivityEvent({
    supabase,
    organizationId: context.activeOrganization.id,
    type: "member_invited",
    title: "Member invited",
    description: `${email} was invited as ${role}.`,
    actorId: user.id,
    metadata: { email, role },
  });

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
}
