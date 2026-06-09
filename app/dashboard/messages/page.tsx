import Link from "next/link";
import { Mail, PenLine } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import {
  createMessageNameMap,
  getMessagePreview,
  latestMessageByConversation,
  messagesNavItems,
  type InternalMessage,
  type MessageConversation,
  type MessageTeamMember,
} from "@/lib/messages";
import { cn } from "@/lib/utils";

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: MessageTeamMember[] | null; error: { message: string } | null }>;
};

export default async function MessagesInboxPage() {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const { data: messages, error } = await supabase
    .from("internal_messages")
    .select("id, organization_id, conversation_id, parent_message_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject, body, read_at, created_at")
    .eq("organization_id", organizationContext.activeOrganization.id)
    .or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[messages] Could not load inbox", { organizationId: organizationContext.activeOrganization.id, error });
  }

  const { data: teamMembers, error: teamError } = await (supabase as unknown as TeamMemberRpcClient).rpc(
    "list_organization_team_members",
    { p_organization_id: organizationContext.activeOrganization.id },
  );

  if (teamError) {
    console.error("[messages] Could not load team names for inbox", { organizationId: organizationContext.activeOrganization.id, error: teamError });
  }

  const nameByUserId = createMessageNameMap(teamMembers ?? []);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Internal messages from your organization."
        actions={<ButtonLink href="/dashboard/messages/new">New message</ButtonLink>}
      />
      <MessagesTabs active="Inbox" />
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>Messages sent to you by teammates.</CardDescription>
            </div>
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <MessageList messages={latestMessageByConversation((messages ?? []) as InternalMessage[], user.id)} userId={user.id} nameByUserId={nameByUserId} emptyTitle="No messages yet" emptyDescription="Messages from your team will appear here." />
        </CardContent>
      </Card>
    </>
  );
}

export function MessagesTabs({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {messagesNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium transition",
            active === item.title
              ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
              : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900",
          )}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}

export function MessageList({
  messages,
  userId,
  nameByUserId,
  emptyTitle,
  emptyDescription,
}: {
  messages: MessageConversation[];
  userId: string;
  nameByUserId: Map<string, string>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!messages.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {messages.map((message) => (
        <ButtonLink key={message.id} href={`/dashboard/messages/${message.id}`} variant="ghost" className="h-auto w-full justify-start rounded-none px-0 py-3 text-left">
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("truncate text-sm", message.read_at ? "font-medium" : "font-semibold")}>{message.subject}</span>
              {message.unread_count > 0 ? <Badge>{message.unread_count} unread</Badge> : null}
            </span>
            <span className="mt-1 block truncate text-sm text-muted-foreground">{getMessagePreview(message.body)}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {message.sender_user_id === userId ? `To ${nameByUserId.get(message.recipient_user_id) ?? "Team member"}` : `From ${nameByUserId.get(message.sender_user_id) ?? "Team member"}`} - {new Date(message.created_at).toLocaleString()}
            </span>
          </span>
          <PenLine className="h-4 w-4 text-muted-foreground" />
        </ButtonLink>
      ))}
    </div>
  );
}
