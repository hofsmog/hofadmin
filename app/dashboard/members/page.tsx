import { MailPlus, Plus, UserRoundCheck, UsersRound } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { membersNavItems } from "@/lib/module-nav";

export default async function MembersOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: members }, { count: totalMembers }, { count: activeMembers }] = await Promise.all([
    supabase.from("members").select("id, name, type, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(6),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
  ]);

  return (
    <>
      <ModuleHeader title="Members" description="Manage people, profiles, member types, and future member QR links." items={membersNavItems} action={{ href: "/dashboard/members/create", label: "Add member" }} />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total members" value={`${totalMembers ?? 0}`} detail="Member records" icon={UsersRound} />
        <StatCard label="Active members" value={`${activeMembers ?? 0}`} detail="Ready for workflows" icon={UserRoundCheck} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent members</CardTitle>
          <CardDescription>Newest records in this organization.</CardDescription>
        </CardHeader>
        <div className="divide-y px-5 pb-5">
          {(members ?? []).length ? members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{member.type} · {member.status}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(member.created_at).toLocaleDateString()}</span>
            </div>
          )) : <div className="py-8 text-center text-sm text-muted-foreground">No members yet.</div>}
        </div>
      </Card>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard/members/create"><Plus className="h-4 w-4" />Add member</ButtonLink>
        <ButtonLink href="/dashboard/members/invitations" variant="secondary"><MailPlus className="h-4 w-4" />Invite team</ButtonLink>
      </div>
    </>
  );
}
