import { MessageSquarePlus } from "lucide-react";
import { MessageComposeForm } from "@/components/dashboard/messages/message-compose-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { MessagesTabs } from "@/app/dashboard/messages/page";

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

export default async function NewMessagePage() {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const { data: teamMembers, error } = await (supabase as unknown as TeamMemberRpcClient).rpc(
    "list_organization_team_members",
    { p_organization_id: organizationContext.activeOrganization.id },
  );

  if (error) {
    console.error("[messages] Could not load recipients", { organizationId: organizationContext.activeOrganization.id, error });
  }

  const recipients = (teamMembers ?? []).filter((member) => member.user_id !== user.id);

  return (
    <>
      <PageHeader title="New message" description="Send a simple internal message to a teammate." />
      <MessagesTabs active="New message" />
      <div className="mt-4">
        {recipients.length ? (
          <MessageComposeForm recipients={recipients} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>No other members available to message.</CardTitle>
                  <CardDescription>Invite another user to this organization before sending messages.</CardDescription>
                </div>
                <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
