import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import {
  createMessageNameMap,
  getMessagePreview,
  latestMessageByConversation,
  type InternalMessage,
  type MessageConversation,
  type MessageTeamMember,
} from "@/lib/messages";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: MessageTeamMember[] | null; error: { message: string } | null }>;
};

export default async function AppMessagesPage() {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: messages, error } = await supabase
    .from("internal_messages")
    .select("id, organization_id, conversation_id, parent_message_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject, body, read_at, created_at")
    .eq("organization_id", organizationId)
    .or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[app/messages] Could not load user messages", {
      organizationId,
      userId: user.id,
      error,
    });
  }

  const { data: teamMembers, error: teamError } = await (supabase as unknown as TeamMemberRpcClient).rpc(
    "list_organization_team_members",
    { p_organization_id: organizationId },
  );

  if (teamError) {
    console.error("[app/messages] Could not load team names", {
      organizationId,
      userId: user.id,
      error: teamError,
    });
  }

  const nameByUserId = createMessageNameMap(teamMembers ?? []);
  const conversations = latestMessageByConversation((messages ?? []) as InternalMessage[], user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <Badge>{organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name}</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Internal messages from your organization.
        </p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>Messages and replies from your team.</CardDescription>
            </div>
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <UserMessageList messages={conversations} userId={user.id} nameByUserId={nameByUserId} />
        </CardContent>
      </Card>
    </div>
  );
}

function UserMessageList({
  messages,
  userId,
  nameByUserId,
}: {
  messages: MessageConversation[];
  userId: string;
  nameByUserId: Map<string, string>;
}) {
  if (!messages.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">No messages yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Messages from your team will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {messages.map((message) => {
        const isSentByUser = message.sender_user_id === userId;
        const personName = isSentByUser
          ? nameByUserId.get(message.recipient_user_id) ?? "Team member"
          : nameByUserId.get(message.sender_user_id) ?? "Team member";

        return (
          <div key={message.id} className="py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn("truncate text-sm", message.read_at ? "font-medium" : "font-semibold")}>{message.subject}</p>
                {message.unread_count > 0 ? <Badge>{message.unread_count} unread</Badge> : null}
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{getMessagePreview(message.body)}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {isSentByUser ? `To ${personName}` : `From ${personName}`} - {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
