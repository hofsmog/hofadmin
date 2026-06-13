"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
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

const validRoles = new Set<OrganizationRole>(["owner", "admin", "manager", "member"]);
const validOrganizationTypes = new Set<OrganizationType>(["school", "club", "business", "restaurant", "cafe", "event", "other"]);
const validSidebarStyles = new Set<OrganizationSidebarStyle>(["light", "dark", "system"]);

export type OrganizationBrandingState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type InviteMemberState = {
  status: "idle" | "success" | "warning" | "error";
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

export async function updateInventorySettingsAction(
  _state: OrganizationBrandingState,
  formData: FormData,
): Promise<OrganizationBrandingState> {
  try {
    const user = await getCurrentUser();
    const supabase = await createClient();

    if (!user || !supabase) {
      redirect("/login");
    }

    const context = await getOrganizationContext(supabase, user);

    if (!canManageOrganization(context.activeMembership.role)) {
      throw new Error("You do not have permission to update inventory settings.");
    }

    const agreementText = sanitizeOptionalLongText(String(formData.get("defaultLoanAgreementText") || ""), 1200, "Loan agreement");

    if (!agreementText) {
      throw new Error("Loan agreement text is required.");
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        default_loan_agreement_text: agreementText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.activeOrganization.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/inventory");

    return { status: "success", message: "Inventory settings saved." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Inventory settings could not be saved.",
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

export async function inviteMemberAction(
  _state: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
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
  const invitedName = sanitizeOptionalDisplayName(String(formData.get("name") || ""));
  const role = String(formData.get("role") || "member") as OrganizationRole;
  const groupIds = Array.from(new Set(formData
    .getAll("groupIds")
    .map((value) => String(value))
    .filter(Boolean)));

  if (!email.includes("@")) {
    return { status: "error", message: "Enter a valid email address." };
  }

  if (!validRoles.has(role)) {
    return { status: "error", message: "Choose a valid role." };
  }

  if (role === "owner" && context.activeMembership.role !== "owner") {
    return { status: "error", message: "Only owners can invite another owner." };
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const token = createInviteToken();

  if (groupIds.length) {
    const { data: validGroups, error: groupsError } = await supabase
      .from("organization_groups")
      .select("id")
      .eq("organization_id", context.activeOrganization.id)
      .in("id", groupIds);

    if (groupsError || (validGroups ?? []).length !== groupIds.length) {
      return { status: "error", message: "One or more selected teams could not be found." };
    }
  }

  console.info("[team-invitations] Creating invitation.", {
    organizationId: context.activeOrganization.id,
    invitedBy: user.id,
    email,
    role,
    invitedName: invitedName ?? null,
    groupCount: groupIds.length,
  });

  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: context.activeOrganization.id,
      email,
      role,
      invited_by: user.id,
      token,
      invited_name: invitedName,
      expires_at: expiresAt,
    })
    .select("id, email, role, token")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    console.error("[team-invitations] Invitation creation failed.", {
      organizationId: context.activeOrganization.id,
      invitedBy: user.id,
      email,
      role,
      error: error.message,
      code: error.code,
    });
    return {
      status: "error",
      message: isDuplicate
        ? "There is already a pending invitation for that email."
        : "Invitation could not be sent. Please check email settings or try again.",
    };
  }

  console.info("[team-invitations] Invitation created.", {
    organizationId: context.activeOrganization.id,
    invitationId: invitation.id,
    email: invitation.email,
    role: invitation.role,
    hasToken: Boolean(invitation.token),
  });

  if (groupIds.length) {
    const { error: groupInsertError } = await supabase
      .from("organization_invitation_groups")
      .insert(groupIds.map((groupId) => ({
        invitation_id: invitation.id,
        organization_id: context.activeOrganization.id,
        group_id: groupId,
      })));

    if (groupInsertError) {
      console.error("[team-invitations] Invitation created but group assignment failed.", {
        organizationId: context.activeOrganization.id,
        invitationId: invitation.id,
        groupIds,
        error: groupInsertError,
      });
    }
  }

  const emailResult = await sendTeamInvitationEmail({
    supabase,
    organizationId: context.activeOrganization.id,
    organizationName: context.activeOrganization.displayName ?? context.activeOrganization.name,
    invitationToken: invitation.token,
    email,
    role,
    invitedByEmail: user.email ?? null,
  });

  await recordActivityEvent({
    supabase,
    organizationId: context.activeOrganization.id,
    type: "member_invited",
    title: "Member invited",
    description: `${email} was invited as ${role}.`,
    actorId: user.id,
    metadata: { email, role, groupIds },
  });

  revalidatePath("/dashboard/settings/team");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");

  if (!emailResult.success) {
    console.error("[team-invitations] Invitation was created but email sending failed.", {
      organizationId: context.activeOrganization.id,
      invitationId: invitation.id,
      email,
      role,
      emailError: emailResult.error,
      emailMessage: emailResult.message,
    });

    return {
      status: "warning",
      message: getInvitationEmailFailureMessage(emailResult),
    };
  }

  return { status: "success", message: "Invitation email sent." };
}

export async function resendInvitationAction(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const context = await getOrganizationContext(supabase, user);

  if (!canManageMembers(context.activeMembership.role)) {
    redirect("/dashboard/settings/team?invitation=permission");
  }

  const invitationId = String(formData.get("invitationId") || "");
  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .select("id, email, role, status, token")
    .eq("id", invitationId)
    .eq("organization_id", context.activeOrganization.id)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !invitation) {
    redirect("/dashboard/settings/team?invitation=missing");
  }

  const emailResult = await sendTeamInvitationEmail({
    supabase,
    organizationId: context.activeOrganization.id,
    organizationName: context.activeOrganization.displayName ?? context.activeOrganization.name,
    invitationToken: invitation.token,
    email: invitation.email,
    role: invitation.role,
    invitedByEmail: user.email ?? null,
  });

  revalidatePath("/dashboard/settings/team");
  redirect(emailResult.success ? "/dashboard/settings/team?invitation=resent" : "/dashboard/settings/team?invitation=email-failed");
}

export async function cancelInvitationAction(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const context = await getOrganizationContext(supabase, user);

  if (!canManageMembers(context.activeMembership.role)) {
    redirect("/dashboard/settings/team?invitation=permission");
  }

  const invitationId = String(formData.get("invitationId") || "");
  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("organization_id", context.activeOrganization.id)
    .eq("status", "pending");

  revalidatePath("/dashboard/settings/team");
  revalidatePath("/dashboard");
  redirect(error ? "/dashboard/settings/team?invitation=cancel-failed" : "/dashboard/settings/team?invitation=cancelled");
}

async function sendTeamInvitationEmail({
  supabase,
  organizationId,
  organizationName,
  invitationToken,
  email,
  role,
  invitedByEmail,
}: {
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
  organizationId: string;
  organizationName: string;
  invitationToken: string;
  email: string;
  role: OrganizationRole;
  invitedByEmail: string | null;
}) {
  const invitationUrl = `${getAppUrl()}/invite/${encodeURIComponent(invitationToken)}`;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const inviterLine = invitedByEmail ? `${invitedByEmail} invited you to join ${organizationName}.` : `You were invited to join ${organizationName}.`;

  return sendEmail({
    supabase,
    organizationId,
    to: [email],
    eventType: "team_invitation",
    subject: `Join ${organizationName} on HofAdmin`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h1 style="margin:0 0 12px">You have been invited to HofAdmin</h1>
        <p>${escapeHtml(inviterLine)}</p>
        <p>Your role: <strong>${escapeHtml(roleLabel)}</strong></p>
        <p><a href="${invitationUrl}" style="display:inline-block;border-radius:10px;background:#18181b;color:#ffffff;padding:12px 16px;text-decoration:none">Accept invitation</a></p>
        <p style="color:#71717a;font-size:14px">This invitation link takes you to HofAdmin. Sign in or create an account with ${escapeHtml(email)} to join.</p>
      </div>
    `,
    text: [
      "You have been invited to HofAdmin.",
      "",
      inviterLine,
      `Your role: ${roleLabel}`,
      "",
      `Accept invitation: ${invitationUrl}`,
      "",
      `Sign in or create an account with ${email} to join.`,
    ].join("\n"),
  });
}

function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getInvitationEmailFailureMessage(emailResult: Awaited<ReturnType<typeof sendEmail>>) {
  if (emailResult.error === "missing_resend_api_key") {
    return "Invitation was created, but email sending is not configured yet. Missing RESEND_API_KEY.";
  }

  if (emailResult.error === "invalid_from_address") {
    return "Invitation was created, but email sending is not configured yet. Missing or invalid EMAIL_FROM_ADDRESS / FROM_EMAIL.";
  }

  if (emailResult.error === "provider_error") {
    return `Invitation was created, but the email provider rejected it: ${emailResult.message}`;
  }

  return `Invitation was created, but the email could not be sent: ${emailResult.message}`;
}
