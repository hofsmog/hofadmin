"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export type MessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type TeamMember = {
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
};

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: TeamMember[] | null; error: { message: string } | null }>;
};

export async function sendInternalMessageAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const recipientUserId = String(formData.get("recipientUserId") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!recipientUserId) {
    return { status: "error", message: "Please select a recipient." };
  }

  if (recipientUserId === user.id) {
    return { status: "error", message: "Choose another team member as the recipient." };
  }

  if (!subject) {
    return { status: "error", message: "Please enter a subject." };
  }

  if (subject.length > 160) {
    return { status: "error", message: "Subject must be 160 characters or fewer." };
  }

  if (!body) {
    return { status: "error", message: "Please enter a message." };
  }

  if (body.length > 5000) {
    return { status: "error", message: "Message must be 5000 characters or fewer." };
  }

  const { data: teamMembers, error: teamError } = await (supabase as unknown as TeamMemberRpcClient).rpc(
    "list_organization_team_members",
    { p_organization_id: organizationId },
  );

  if (teamError) {
    console.error("[messages] Could not load team members for message send", {
      organizationId,
      senderUserId: user.id,
      error: teamError,
    });
    return {
      status: "error",
      message: `Message could not be sent. Recipient lookup failed: ${teamError.message}`,
    };
  }

  const members = teamMembers ?? [];
  const senderMembership = members.find((member) => member.user_id === user.id);
  const recipient = members.find((member) => member.user_id === recipientUserId);

  if (!senderMembership) {
    console.error("[messages] Sender is not in organization team member lookup", {
      organizationId,
      senderUserId: user.id,
      availableUserIds: members.map((member) => member.user_id),
    });
    return { status: "error", message: "Message could not be sent. Sender is not a member of this organization." };
  }

  if (!recipient) {
    console.error("[messages] Recipient is not in organization team member lookup", {
      organizationId,
      senderUserId: user.id,
      recipientUserId,
      availableUserIds: members.map((member) => member.user_id),
    });
    return { status: "error", message: "Recipient must be a member of this organization." };
  }

  const messageRecord = {
    organization_id: organizationId,
    sender_user_id: user.id,
    recipient_user_id: recipient.user_id,
    sender_email: user.email ?? "Unknown sender",
    recipient_email: recipient.email,
    subject,
    body,
  };

  const { error } = await supabase.from("internal_messages").insert({
    ...messageRecord,
  });

  if (error) {
    console.error("[messages] Could not send message", {
      organizationId,
      senderUserId: user.id,
      recipientUserId,
      messageRecord: {
        ...messageRecord,
        body: `[${body.length} characters]`,
      },
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
    });
    return { status: "error", message: `Message could not be sent: ${error.message}` };
  }

  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/messages/sent");
  revalidatePath("/dashboard");
  return { status: "success", message: "Message sent" };
}

export async function markInternalMessageReadAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const messageId = String(formData.get("messageId") || "");

  const { error } = await supabase
    .from("internal_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[messages] Could not mark message read", {
      organizationId: organizationContext.activeOrganization.id,
      messageId,
      error,
    });
    redirect(`/dashboard/messages/${messageId}?error=read`);
  }

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${messageId}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/messages/${messageId}`);
}
