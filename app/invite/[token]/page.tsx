import { redirect } from "next/navigation";
import { InvitationAuthPanel } from "@/components/invitations/invitation-auth-panel";
import { InvitationMismatchPanel } from "@/components/invitations/invitation-mismatch-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type InvitationContext = Database["public"]["Functions"]["get_organization_invitation_by_token"]["Returns"][number];

type InvitationTokenRpcClient = {
  rpc(
    fn: "get_organization_invitation_by_token",
    args: { p_token: string },
  ): Promise<{ data: InvitationContext[] | null; error: { message: string } | null }>;
};

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    return <InvitationError title="Invitation link is missing" message="Ask the organization admin to resend the invitation." />;
  }

  const supabase = await createClient();

  if (!supabase) {
    return <InvitationError title="Invitation could not load" message="Supabase is not configured for this environment." />;
  }

  const { data, error } = await (supabase as unknown as InvitationTokenRpcClient).rpc(
    "get_organization_invitation_by_token",
    { p_token: token },
  );
  const invitation = data?.[0] ?? null;

  if (error || !invitation) {
    return <InvitationError title="Invitation could not load" message="This invitation was not found. Ask the organization admin to resend it." />;
  }

  if (invitation.invitation_status === "accepted") {
    return <InvitationError title="Invitation already accepted" message="This invitation has already been used." />;
  }

  if (invitation.invitation_status === "revoked" || invitation.invitation_expired) {
    return <InvitationError title="Invitation no longer available" message="This invitation has expired or was cancelled." />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <InvitationAuthPanel
        invitationToken={token}
        organizationName={invitation.organization_name}
        invitedEmail={invitation.invited_email}
        invitedName={invitation.invited_name}
        inviterName={invitation.inviter_name}
      />
    );
  }

  const signedInEmail = user.email?.toLowerCase() ?? "";
  const invitedEmail = invitation.invited_email.toLowerCase();

  if (signedInEmail !== invitedEmail) {
    return (
      <InvitationMismatchPanel
        invitedEmail={invitation.invited_email}
        signedInEmail={user.email ?? "this account"}
        organizationName={invitation.organization_name}
        returnTo={`/invite/${encodeURIComponent(token)}`}
      />
    );
  }

  redirect(`/invitations/complete?token=${encodeURIComponent(token)}`);
}

function InvitationError({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
