"use server";

import { revalidatePath } from "next/cache";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { sendNotificationEmail } from "@/lib/notifications/send-notification-email";
import { getEffectiveMemberLimit, getMemberLimitMessage } from "@/lib/plans";
import type { MemberStatus, MemberType } from "@/types/database";

const memberTypes = new Set<MemberType>([
  "student",
  "staff",
  "player",
  "volunteer",
  "employee",
  "customer",
  "guest",
  "other",
]);

const memberStatuses = new Set<MemberStatus>(["active", "inactive"]);

export type MemberFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createMemberAction(
  _state: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "other") as MemberType;
  const status = String(formData.get("status") || "active") as MemberStatus;
  const memberNumber = String(formData.get("memberNumber") || "").trim() || null;
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (name.length < 2 || name.length > 120) {
    return { status: "error", message: "Member name must be between 2 and 120 characters." };
  }

  if (!memberTypes.has(type)) {
    return { status: "error", message: "Choose a valid member type." };
  }

  if (!memberStatuses.has(status)) {
    return { status: "error", message: "Choose a valid member status." };
  }

  if (email && !email.includes("@")) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const memberLimit = getEffectiveMemberLimit(organizationContext.activeOrganization);

  if (memberLimit !== null) {
    const { count, error: countError } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id);

    if (countError) {
      return { status: "error", message: countError.message };
    }

    if ((count ?? 0) >= memberLimit) {
      return {
        status: "error",
        message: getMemberLimitMessage(organizationContext.activeOrganization) ?? "You have reached the member limit for your current plan.",
      };
    }
  }

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      organization_id: organizationContext.activeOrganization.id,
      name,
      member_number: memberNumber,
      type,
      status,
      email,
      phone,
      tags,
      notes,
      created_by: user.id,
    })
    .select("id, name, type, status")
    .single();

  if (error || !member) {
    return { status: "error", message: error?.message ?? "Member could not be created." };
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "member_created",
    title: "Member created",
    description: `${member.name} was added as ${member.type}.`,
    actorId: user.id,
    metadata: { memberId: member.id, status: member.status, type: member.type },
  });

  await sendNotificationEmail({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    eventType: "new_member_added",
    subject: `New member added: ${member.name}`,
    preview: `${member.name} was added to ${organizationContext.activeOrganization.name}.`,
    body: `${member.name} was added as ${member.type}.`,
  }).catch(() => null);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/members/list");
  revalidatePath("/dashboard/members/create");

  return { status: "success", message: `${member.name} was added.` };
}
