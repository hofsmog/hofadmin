"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  canManageMembers,
  canManageOrganization,
  createOrganizationForUser,
  getOrganizationContext,
  sanitizeOrganizationName,
  setActiveOrganizationCookie,
} from "@/lib/organizations";
import type { OrganizationRole } from "@/types/database";

const validRoles = new Set<OrganizationRole>(["owner", "admin", "member"]);

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
  const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.activeOrganization.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings");
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

  revalidatePath("/dashboard/team");
}
