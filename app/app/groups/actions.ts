"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export async function createOrganizationGroupAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();

  if (!canManageGroups(organizationContext.activeMembership.role)) {
    return;
  }

  const organizationId = organizationContext.activeOrganization.id;
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const returnTo = getSafeReturnPath(String(formData.get("returnTo") || "").trim());

  if (!name) {
    return;
  }

  const { data, error } = await supabase
    .from("organization_groups")
    .insert({
      organization_id: organizationId,
      name,
      description: description || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[groups] Could not create group", {
      organizationId,
      userId: user.id,
      error,
    });
    return;
  }

  revalidatePath("/app/groups");
  revalidatePath("/dashboard/members");
  redirect(returnTo || `/app/groups/${data.id}`);
}

export async function updateOrganizationGroupAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();

  if (!canManageGroups(organizationContext.activeMembership.role)) {
    return;
  }

  const organizationId = organizationContext.activeOrganization.id;
  const groupId = String(formData.get("groupId") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!groupId || !name) {
    return;
  }

  const { error } = await supabase
    .from("organization_groups")
    .update({
      name,
      description: description || null,
    })
    .eq("organization_id", organizationId)
    .eq("id", groupId);

  if (error) {
    console.error("[groups] Could not update group", {
      organizationId,
      userId: user.id,
      groupId,
      error,
    });
    return;
  }

  revalidatePath("/app/groups");
  revalidatePath(`/app/groups/${groupId}`);
}

export async function deleteOrganizationGroupAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();

  if (!canManageGroups(organizationContext.activeMembership.role)) {
    return;
  }

  const organizationId = organizationContext.activeOrganization.id;
  const groupId = String(formData.get("groupId") || "");

  if (!groupId) {
    return;
  }

  const [{ count: memberCount }, { count: permissionCount }] = await Promise.all([
    supabase
      .from("organization_group_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("group_id", groupId),
    supabase
      .from("organization_module_permissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("group_id", groupId),
  ]);

  if ((memberCount ?? 0) > 0 || (permissionCount ?? 0) > 0) {
    console.error("[groups] Refused to delete group with dependencies", {
      organizationId,
      userId: user.id,
      groupId,
      memberCount,
      permissionCount,
    });
    return;
  }

  const { error } = await supabase
    .from("organization_groups")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", groupId);

  if (error) {
    console.error("[groups] Could not delete group", {
      organizationId,
      userId: user.id,
      groupId,
      error,
    });
    return;
  }

  revalidatePath("/app/groups");
  redirect("/app/groups");
}

export async function addOrganizationGroupMemberAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();

  if (!canManageGroups(organizationContext.activeMembership.role)) {
    return;
  }

  const organizationId = organizationContext.activeOrganization.id;
  const groupId = String(formData.get("groupId") || "");
  const userIds = formData
    .getAll("userIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!groupId || userIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("organization_group_members")
    .insert(userIds.map((userId) => ({
      organization_id: organizationId,
      group_id: groupId,
      user_id: userId,
      added_by: user.id,
    })));

  if (error) {
    console.error("[groups] Could not add group member", {
      organizationId,
      actorId: user.id,
      groupId,
      userIds,
      error,
    });
    return;
  }

  revalidatePath("/app/groups");
  revalidatePath(`/app/groups/${groupId}`);
}

export async function removeOrganizationGroupMemberAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();

  if (!canManageGroups(organizationContext.activeMembership.role)) {
    return;
  }

  const organizationId = organizationContext.activeOrganization.id;
  const groupId = String(formData.get("groupId") || "");
  const membershipId = String(formData.get("membershipId") || "");

  if (!groupId || !membershipId) {
    return;
  }

  const { error } = await supabase
    .from("organization_group_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("group_id", groupId)
    .eq("id", membershipId);

  if (error) {
    console.error("[groups] Could not remove group member", {
      organizationId,
      actorId: user.id,
      groupId,
      membershipId,
      error,
    });
    return;
  }

  revalidatePath("/app/groups");
  revalidatePath(`/app/groups/${groupId}`);
}

function canManageGroups(role: string) {
  return role === "owner" || role === "admin" || role === "manager";
}

function getSafeReturnPath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  return value;
}
