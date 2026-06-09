export const messagesNavItems = [
  { title: "Inbox", href: "/dashboard/messages" },
  { title: "Sent", href: "/dashboard/messages/sent" },
  { title: "New message", href: "/dashboard/messages/new" },
];

export type InternalMessage = {
  id: string;
  organization_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
};
