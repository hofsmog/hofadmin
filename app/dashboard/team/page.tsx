import { Shield, UsersRound } from "lucide-react";
import { InviteMemberForm } from "@/components/dashboard/invite-member-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageMembers } from "@/lib/organizations";

export default async function TeamMembersPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canInvite = canManageMembers(activeMembership.role);
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", activeOrganization.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", activeOrganization.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Team Members"
        description={`Manage access for ${activeOrganization.name}. Roles are scoped per organization for future RLS policies.`}
      />
      <div className="space-y-4">
        <InviteMemberForm disabled={!canInvite} activeRole={activeMembership.role} />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>Authenticated users with access to this organization.</CardDescription>
              </div>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(members ?? []).map((member) => (
              <div key={`${member.organization_id}-${member.user_id}`} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{member.user_id}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                </div>
                <Badge className="capitalize">{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Pending invitations</CardTitle>
                <CardDescription>Prepared invitation records for email delivery in a later phase.</CardDescription>
              </div>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(invitations ?? []).length ? (
              invitations?.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">Invited {new Date(invite.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="capitalize">{invite.role}</Badge>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground">No pending invitations.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
