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
import type { OrganizationRole, OrganizationSidebarStyle, OrganizationType } from "@/types/database";

const validRoles = new Set<OrganizationRole>(["owner", "admin", "member"]);
const validOrganizationTypes = new Set<OrganizationType>(["school", "club", "business", "restaurant", "cafe", "event", "other"]);
const validSidebarStyles = new Set<OrganizationSidebarStyle>(["light", "dark", "system"]);

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
  const logoUrl = sanitizeOptionalUrl(String(formData.get("logoUrl") || ""));
  const faviconUrl = sanitizeOptionalUrl(String(formData.get("faviconUrl") || ""));
  const fallbackAvatarUrl = sanitizeOptionalUrl(String(formData.get("avatarUrl") || ""));
  const avatarUrl = logoUrl ?? fallbackAvatarUrl;
  const accentColor = sanitizeAccentColor(String(formData.get("accentColor") || ""));
  const backgroundColor = sanitizeColor(String(formData.get("backgroundColor") || ""), "Background color");
  const sidebarStyle = sanitizeSidebarStyle(String(formData.get("sidebarStyle") || ""));
  const publicBrandingEnabled = formData.get("publicBrandingEnabled") === "on";
  const customWelcomeMessage = sanitizeOptionalLongText(String(formData.get("customWelcomeMessage") || ""), 240, "Welcome message");
  const supportEmail = sanitizeOptionalEmail(String(formData.get("supportEmail") || ""));
  const websiteUrl = sanitizeOptionalUrl(String(formData.get("websiteUrl") || ""));

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      display_name: displayName,
      organization_type: organizationType,
      avatar_url: avatarUrl,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      accent_color: accentColor,
      background_color: backgroundColor,
      sidebar_style: sidebarStyle,
      public_branding_enabled: publicBrandingEnabled,
      custom_welcome_message: customWelcomeMessage,
      support_email: supportEmail,
      website_url: websiteUrl,
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
      backgroundColor,
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
  return sanitizeColor(value, "Accent color");
}

function sanitizeColor(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    throw new Error(`${label} must be a valid hex color like #2563eb.`);
  }

  return trimmed;
}

function sanitizeSidebarStyle(value: string) {
  const trimmed = value.trim() as OrganizationSidebarStyle;
  return validSidebarStyles.has(trimmed) ? trimmed : "system";
}

function sanitizeOptionalLongText(value: string, maxLength: number, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }

  return trimmed;
}

function sanitizeOptionalEmail(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  if (!trimmed.includes("@")) {
    throw new Error("Support email must be a valid email address.");
  }

  return trimmed;
}

function sanitizeOptionalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return trimmed;
    }
  } catch {
    // Handled below.
  }

  throw new Error("URLs must start with http:// or https://.");
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
