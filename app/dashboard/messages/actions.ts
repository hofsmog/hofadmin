"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

const attachmentBucket = "internal-message-attachments";
const maxAttachmentSize = 10 * 1024 * 1024;
const maxAttachmentCount = 5;
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export type MessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type TeamMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  joined_at: string;
};

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: TeamMember[] | null; error: { message: string } | null }>;
};

type MessageLookup = {
  id: string;
  organization_id: string;
  conversation_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
};

type UploadedAttachment = {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string | null;
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

  const attachments = getAttachmentFiles(formData);
  const attachmentValidation = validateAttachmentFiles(attachments);

  if (attachmentValidation.status === "error") {
    return { status: "error", message: attachmentValidation.message };
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

  const messageId = randomUUID();
  const conversationId = randomUUID();
  const messageRecord = {
    id: messageId,
    organization_id: organizationId,
    conversation_id: conversationId,
    parent_message_id: null,
    sender_user_id: user.id,
    recipient_user_id: recipient.user_id,
    sender_email: user.email ?? "Unknown sender",
    recipient_email: recipient.email,
    subject,
    body,
  };

  const uploadedAttachments = await uploadMessageFiles({
    supabase,
    organizationId,
    messageId,
    files: attachments,
  });

  if (uploadedAttachments.status === "error") {
    return {
      status: "error",
      message: `Message could not be sent because the attachment upload failed. ${uploadedAttachments.message}`,
    };
  }

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

  const attachmentResult = await createMessageAttachmentRecords({
    supabase,
    organizationId,
    messageId,
    userId: user.id,
    attachments: uploadedAttachments.attachments,
  });

  if (attachmentResult.status === "error") {
    return {
      status: "error",
      message: `Message was created, but the attachment could not be linked. ${attachmentResult.message}`,
    };
  }

  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/messages/sent");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Message sent",
  };
}

export async function replyToInternalMessageAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const parentMessageId = String(formData.get("parentMessageId") || "");
  const body = String(formData.get("body") || "").trim();

  if (!parentMessageId) {
    return { status: "error", message: "Reply could not be sent. Message is missing." };
  }

  if (!body) {
    return { status: "error", message: "Please enter a message." };
  }

  if (body.length > 5000) {
    return { status: "error", message: "Message must be 5000 characters or fewer." };
  }

  const attachments = getAttachmentFiles(formData);
  const attachmentValidation = validateAttachmentFiles(attachments);

  if (attachmentValidation.status === "error") {
    return { status: "error", message: attachmentValidation.message };
  }

  const { data: parent, error: parentError } = await supabase
    .from("internal_messages")
    .select("id, organization_id, conversation_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject")
    .eq("id", parentMessageId)
    .eq("organization_id", organizationId)
    .or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
    .maybeSingle();

  if (parentError || !parent) {
    console.error("[messages] Could not load parent message for reply", {
      organizationId,
      parentMessageId,
      senderUserId: user.id,
      error: parentError,
    });
    return { status: "error", message: "Reply could not be sent. The conversation could not be found." };
  }

  const conversation = parent as MessageLookup;
  const recipientUserId = conversation.sender_user_id === user.id ? conversation.recipient_user_id : conversation.sender_user_id;
  const recipientEmail = conversation.sender_user_id === user.id ? conversation.recipient_email : conversation.sender_email;
  const subject = conversation.subject.toLowerCase().startsWith("re:") ? conversation.subject : `Re: ${conversation.subject}`;
  const messageId = randomUUID();

  const messageRecord = {
    id: messageId,
    organization_id: organizationId,
    conversation_id: conversation.conversation_id,
    parent_message_id: conversation.id,
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    sender_email: user.email ?? "Unknown sender",
    recipient_email: recipientEmail,
    subject,
    body,
  };

  const uploadedAttachments = await uploadMessageFiles({
    supabase,
    organizationId,
    messageId,
    files: attachments,
  });

  if (uploadedAttachments.status === "error") {
    return {
      status: "error",
      message: `Reply could not be sent because the attachment upload failed. ${uploadedAttachments.message}`,
    };
  }

  const { error } = await supabase.from("internal_messages").insert({
    ...messageRecord,
  });

  if (error) {
    console.error("[messages] Could not send reply", {
      organizationId,
      parentMessageId,
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
    return { status: "error", message: `Reply could not be sent: ${error.message}` };
  }

  const attachmentResult = await createMessageAttachmentRecords({
    supabase,
    organizationId,
    messageId,
    userId: user.id,
    attachments: uploadedAttachments.attachments,
  });

  if (attachmentResult.status === "error") {
    return {
      status: "error",
      message: `Reply was created, but the attachment could not be linked. ${attachmentResult.message}`,
    };
  }

  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/messages/sent");
  revalidatePath(`/dashboard/messages/${parentMessageId}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Reply sent",
  };
}

export async function markInternalMessageReadAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const messageId = String(formData.get("messageId") || "");
  const conversationId = String(formData.get("conversationId") || "");

  let updateQuery = supabase
    .from("internal_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  updateQuery = conversationId ? updateQuery.eq("conversation_id", conversationId) : updateQuery.eq("id", messageId);

  const { error } = await updateQuery;

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

function getAttachmentFiles(formData: FormData) {
  return formData.getAll("attachments").filter((file): file is File => file instanceof File && Boolean(file.name) && file.size > 0);
}

function validateAttachmentFiles(files: File[]) {
  if (!files.length) {
    return { status: "success" as const };
  }

  if (files.length > maxAttachmentCount) {
    return { status: "error" as const, message: `You can attach up to ${maxAttachmentCount} files.` };
  }

  for (const file of files) {
    if (file.size > maxAttachmentSize) {
      console.error("[messages] Attachment is too large", {
        fileName: file.name,
        fileSize: file.size,
        maxAttachmentSize,
      });
      return { status: "error" as const, message: `${file.name} is larger than 10 MB.` };
    }

    if (file.type && !allowedAttachmentTypes.has(file.type)) {
      console.error("[messages] Attachment type is not allowed", {
        fileName: file.name,
        mimeType: file.type,
      });
      return { status: "error" as const, message: `${file.name} is not an allowed file type.` };
    }
  }

  return { status: "success" as const };
}

async function uploadMessageFiles({
  supabase,
  organizationId,
  messageId,
  files,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  messageId: string;
  files: File[];
}) {
  const uploaded: UploadedAttachment[] = [];

  for (const file of files) {
    const safeName = sanitizeFileName(file.name);
    const filePath = `organizations/${organizationId}/messages/${messageId}/${Date.now()}-${randomUUID()}-${safeName}`;
    let uploadError: unknown = null;

    try {
      const result = await supabase.storage.from(attachmentBucket).upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      uploadError = result.error;
    } catch (error) {
      uploadError = error;
    }

    if (uploadError) {
      console.error("[messages] Could not upload attachment", {
        organizationId,
        messageId,
        bucket: attachmentBucket,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        error: serializeError(uploadError),
      });
      return { status: "error" as const, message: describeAttachmentFailure(uploadError) };
    }

    uploaded.push({
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type || null,
    });
  }

  return { status: "success" as const, attachments: uploaded };
}

async function createMessageAttachmentRecords({
  supabase,
  organizationId,
  messageId,
  userId,
  attachments,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  messageId: string;
  userId: string;
  attachments: UploadedAttachment[];
}) {
  if (!attachments.length) {
    return { status: "success" as const };
  }

  const records = attachments.map((attachment) => ({
    message_id: messageId,
    organization_id: organizationId,
    file_name: attachment.fileName,
    file_path: attachment.filePath,
    file_size: attachment.fileSize,
    mime_type: attachment.mimeType,
    uploaded_by: userId,
  }));

  const { error: attachmentError } = await supabase.from("internal_message_attachments").insert(records);

  if (attachmentError) {
    console.error("[messages] Could not create attachment records", {
      organizationId,
      messageId,
      records: records.map((record) => ({
        ...record,
        file_path: record.file_path,
      })),
      error: {
        code: attachmentError.code,
        message: attachmentError.message,
        details: attachmentError.details,
        hint: attachmentError.hint,
      },
    });
    return { status: "error" as const, message: attachmentError.message };
  }

  return { status: "success" as const };
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
  return `${base}${extension}`;
}

function describeAttachmentFailure(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("bucket") && lowerMessage.includes("not found")) {
    return "The attachment storage bucket is missing.";
  }

  if (lowerMessage.includes("row-level security") || lowerMessage.includes("permission") || lowerMessage.includes("unauthorized")) {
    return "Storage permissions blocked the upload.";
  }

  return message || "Please try another file or try again.";
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}
