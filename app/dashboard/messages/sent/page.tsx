import { Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { createMessageNameMap, latestMessageByConversation, type InternalMessage, type MessageTeamMember } from "@/lib/messages";
import { MessageList, MessagesTabs } from "@/app/dashboard/messages/page";

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: MessageTeamMember[] | null; error: { message: string } | null }>;
};

export default async function SentMessagesPage({ searchParams }: { searchParams?: Promise<{ sent?: string }> }) {
  const params = (await searchParams) ?? {};
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const { data: messages, error } = await supabase
    .from("internal_messages")
    .select("id, organization_id, conversation_id, parent_message_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject, body, read_at, created_at")
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("sender_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[messages] Could not load sent messages", { organizationId: organizationContext.activeOrganization.id, error });
  }

  const { data: teamMembers, error: teamError } = await (supabase as unknown as TeamMemberRpcClient).rpc(
    "list_organization_team_members",
    { p_organization_id: organizationContext.activeOrganization.id },
  );

  if (teamError) {
    console.error("[messages] Could not load team names for sent messages", { organizationId: organizationContext.activeOrganization.id, error: teamError });
  }

  const nameByUserId = createMessageNameMap(teamMembers ?? []);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Internal messages from your organization."
        actions={<ButtonLink href="/dashboard/messages/new">New message</ButtonLink>}
      />
      <Toast show={params.sent === "1"} title="Message sent" message="Your message was sent." />
      <MessagesTabs active="Sent" />
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Sent</CardTitle>
              <CardDescription>Messages you sent to teammates.</CardDescription>
            </div>
            <Send className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <MessageList messages={latestMessageByConversation((messages ?? []) as InternalMessage[], user.id)} userId={user.id} nameByUserId={nameByUserId} emptyTitle="No sent messages yet" emptyDescription="Messages you send will appear here." />
        </CardContent>
      </Card>
    </>
  );
}
