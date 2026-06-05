"use server";

import { revalidatePath } from "next/cache";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { sendNotificationEmail } from "@/lib/email/sendNotificationEmail";
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

  const { data: preferences } = await supabase
    .from("organization_notification_preferences")
    .select("enable_email_notifications, notify_new_member_added, notification_emails")
    .eq("organization_id", organizationContext.activeOrganization.id)
    .maybeSingle();

  if (preferences?.enable_email_notifications && preferences.notify_new_member_added) {
    await sendNotificationEmail({
      to: preferences.notification_emails,
      subject: `New member added: ${member.name}`,
      preview: `${member.name} was added to ${organizationContext.activeOrganization.name}.`,
      body: `${member.name} was added as ${member.type}.`,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/members/list");
  revalidatePath("/dashboard/members/create");

  return { status: "success", message: `${member.name} was added.` };
}
