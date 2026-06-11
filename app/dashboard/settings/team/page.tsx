import Link from "next/link";
import { MailPlus, ShieldCheck, UsersRound } from "lucide-react";
import { cancelInvitationAction, resendInvitationAction } from "@/app/dashboard/organizations/actions";
import { InviteMemberForm } from "@/components/dashboard/invite-member-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageMembers } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import type { OrganizationRole } from "@/types/database";

const tabs = [
  { id: "people", label: "People" },
  { id: "invitations", label: "Invitations" },
  { id: "roles", label: "Roles & Permissions" },
] as const;

const roles: Array<{ name: string; value: OrganizationRole; detail: string }> = [
  { name: "Owner", value: "owner", detail: "Full organization control, including settings, modules, and owner invitations." },
  { name: "Admin", value: "admin", detail: "Can manage daily organization work and invite admins or members." },
  { name: "Manager", value: "manager", detail: "Can manage assigned team workflows such as groups without full organization settings access." },
  { name: "Member", value: "member", detail: "Can access organization tools without changing core settings." },
];

export default async function SettingsTeamPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; invitation?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const activeTab = tabs.some((tab) => tab.id === params.tab) ? params.tab : "people";
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
        title="Team"
        description="Invite teammates, review pending invitations, and understand access roles."
      />
      <Toast show={params.invitation === "resent"} title="Invitation resent" message="The invitation email was sent again." />
      <Toast show={params.invitation === "cancelled"} title="Invitation cancelled" message="The pending invitation was cancelled." />
      <Toast
        show={["email-failed", "permission", "missing", "cancel-failed"].includes(params.invitation ?? "")}
        tone="error"
        title="Invitation action failed"
        message={
          params.invitation === "email-failed"
            ? "Invitation could not be sent. Please check email settings or try again."
            : params.invitation === "permission"
              ? "Only owners and admins can manage invitations."
              : params.invitation === "missing"
                ? "That pending invitation could not be found."
                : "The invitation could not be cancelled. Please try again."
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/settings/team?tab=${tab.id}`}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === "people" ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>People</CardTitle>
                <CardDescription>Users with access to {activeOrganization.displayName ?? activeOrganization.name}.</CardDescription>
              </div>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(members ?? []).length ? (
                members?.map((member) => (
                  <div key={`${member.organization_id}-${member.user_id}`} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{member.user_id}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                    <Badge className="capitalize">{member.role}</Badge>
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-muted-foreground">No people have joined this organization yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "invitations" ? (
        <div className="space-y-4">
          <InviteMemberForm disabled={!canInvite} activeRole={activeMembership.role} />
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Pending invitations</CardTitle>
                  <CardDescription>Invited teammates appear here until they accept or are cancelled.</CardDescription>
                </div>
                <MailPlus className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {(invitations ?? []).length ? (
                  invitations?.map((invite) => (
                    <div key={invite.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invite.role} - Pending - Invited {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <form action={resendInvitationAction}>
                          <input type="hidden" name="invitationId" value={invite.id} />
                          <Button type="submit" variant="secondary" className="h-9 px-3">Resend</Button>
                        </form>
                        <form action={cancelInvitationAction}>
                          <input type="hidden" name="invitationId" value={invite.id} />
                          <Button type="submit" variant="secondary" className="h-9 px-3">Cancel</Button>
                        </form>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">No pending invitations.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "roles" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <Card key={role.value}>
              <CardHeader>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription>{role.detail}</CardDescription>
                <div className="pt-2"><Badge>Current role model</Badge></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : null}
    </>
  );
}
