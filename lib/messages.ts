export const messagesNavItems = [
  { title: "Inbox", href: "/dashboard/messages" },
  { title: "Sent", href: "/dashboard/messages/sent" },
  { title: "New message", href: "/dashboard/messages/new" },
];

export type MessageTeamMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  joined_at?: string;
};

export type InternalMessage = {
  id: string;
  organization_id: string;
  conversation_id: string;
  parent_message_id: string | null;
  sender_user_id: string;
  recipient_user_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type InternalMessageAttachment = {
  id: string;
  message_id: string;
  organization_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
};

export type MessageConversation = InternalMessage & {
  unread_count: number;
};

export function getMessageDisplayName(userId: string, teamMembers: MessageTeamMember[], fallback = "Team member") {
  const member = teamMembers.find((teamMember) => teamMember.user_id === userId);
  const name = member?.display_name?.trim();
  return name || fallback;
}

export function createMessageNameMap(teamMembers: MessageTeamMember[]) {
  return new Map(teamMembers.map((teamMember) => [teamMember.user_id, getMessageDisplayName(teamMember.user_id, teamMembers)]));
}

export function latestMessageByConversation(messages: InternalMessage[], userId: string, sentOnly = false) {
  const grouped = new Map<string, MessageConversation>();

  for (const message of messages) {
    const existing = grouped.get(message.conversation_id);
    const isUnreadForUser = message.recipient_user_id === userId && !message.read_at;

    if (!existing || new Date(message.created_at).getTime() > new Date(existing.created_at).getTime()) {
      grouped.set(message.conversation_id, {
        ...message,
        unread_count: (existing?.unread_count ?? 0) + (isUnreadForUser ? 1 : 0),
      });
      continue;
    }

    if (isUnreadForUser) {
      existing.unread_count += 1;
    }
  }

  return Array.from(grouped.values())
    .filter((message) => !sentOnly || message.sender_user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getMessagePreview(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
