import { InviteMemberForm } from "@/components/dashboard/invite-member-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageMembers } from "@/lib/organizations";
import { membersNavItems } from "@/lib/module-nav";

export default async function MembersInvitationsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canInvite = canManageMembers(activeMembership.role);
  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", activeOrganization.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <>
      <ModuleHeader title="Invitations" description="Invite teammates who help manage the organization." items={membersNavItems} />
      <div className="space-y-4">
        <InviteMemberForm disabled={!canInvite} activeRole={activeMembership.role} />
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Open team invitations for this organization.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(invitations ?? []).length ? invitations?.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-4 py-3">
                <div><p className="text-sm font-medium">{invite.email}</p><p className="text-xs text-muted-foreground">Invited {new Date(invite.created_at).toLocaleDateString()}</p></div>
                <Badge className="capitalize">{invite.role}</Badge>
              </div>
            )) : <p className="py-4 text-sm text-muted-foreground">No pending invitations.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
