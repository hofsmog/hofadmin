import { MailPlus, Plus, UserRoundCheck, UsersRound } from "lucide-react";
import { createOrganizationGroupAction } from "@/app/app/groups/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { membersNavItems } from "@/lib/module-nav";
import type { Database } from "@/types/database";

type OrganizationGroup = Database["public"]["Tables"]["organization_groups"]["Row"];
type GroupMember = Pick<Database["public"]["Tables"]["organization_group_members"]["Row"], "group_id">;

export default async function MembersOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [
    { data: members },
    { count: totalMembers },
    { count: activeMembers },
    { count: pendingInvitations },
    { data: groups },
  ] = await Promise.all([
    supabase.from("members").select("id, name, type, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(6),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("organization_groups")
      .select("id, organization_id, name, description, created_by, created_at, updated_at")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  ]);
  const groupIds = (groups ?? []).map((group) => group.id);
  const { data: groupMembers } = groupIds.length
    ? await supabase
        .from("organization_group_members")
        .select("group_id")
        .eq("organization_id", organizationId)
        .in("group_id", groupIds)
    : { data: [] };
  const memberCounts = countMembersByGroup((groupMembers ?? []) as GroupMember[]);
  const hasMembers = (totalMembers ?? 0) > 0;
  const statItems = [
    {
      label: "Total members",
      value: totalMembers ?? 0,
      detail: "Member records",
      icon: UsersRound,
    },
    {
      label: "Active members",
      value: activeMembers ?? 0,
      detail: "Ready for workflows",
      icon: UserRoundCheck,
    },
    {
      label: "Pending invitations",
      value: pendingInvitations ?? 0,
      detail: "Waiting for acceptance",
      icon: MailPlus,
    },
  ].filter((item) => item.value > 0);

  return (
    <>
      <ModuleHeader
        title="Members & Teams"
        description="Add people first, then organize them into teams when it helps."
        items={membersNavItems}
      />

      <section className="mb-5 rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Add people to your organization</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Start by adding a member record or inviting someone to create their account. Teams can come after the people are in place.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink href="/dashboard/members/create">
              <Plus className="h-4 w-4" />
              Add member
            </ButtonLink>
            <ButtonLink href="/dashboard/settings/team?tab=invitations" variant="secondary">
              <MailPlus className="h-4 w-4" />
              Invite member
            </ButtonLink>
          </div>
        </div>
      </section>

      {statItems.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {statItems.map((item) => (
            <StatCard key={item.label} label={item.label} value={`${item.value}`} detail={item.detail} icon={item.icon} />
          ))}
        </div>
      ) : null}

      {hasMembers ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent members</CardTitle>
            <CardDescription>Newest records in this organization.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{member.type} - {member.status}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div id="teams" className="mt-6 grid scroll-mt-24 gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              {hasMembers
                ? "Use teams to organize people by responsibility, department, class, or group."
                : "Add members first. Teams can be created later."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!hasMembers ? (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Teams can wait</p>
                <p className="mt-1 text-sm text-muted-foreground">Once people are added, you can organize them into teams here.</p>
              </div>
            ) : (groups ?? []).length ? (
              ((groups ?? []) as OrganizationGroup[]).map((group) => (
                <div key={group.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{group.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{group.description || "No description yet"}</p>
                  </div>
                  <Badge>{formatMemberCount(memberCounts.get(group.id) ?? 0)}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No teams yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add members first, then create teams when you need structure.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {hasMembers ? (
          <Card id="create-team">
            <CardHeader>
              <CardTitle>Create team</CardTitle>
              <CardDescription>Secondary setup for organizing people after they are added.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createOrganizationGroupAction} className="space-y-4">
                <input type="hidden" name="returnTo" value="/dashboard/members#create-team" />
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Team name</span>
                  <Input name="name" required minLength={2} maxLength={80} placeholder="Maintenance" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="What this team is responsible for"
                    className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  />
                </label>
                <ActionSubmitButton pendingLabel="Creating">Create team</ActionSubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}

function countMembersByGroup(members: GroupMember[]) {
  const counts = new Map<string, number>();

  for (const member of members) {
    counts.set(member.group_id, (counts.get(member.group_id) ?? 0) + 1);
  }

  return counts;
}

function formatMemberCount(count: number) {
  return `${count} ${count === 1 ? "member" : "members"}`;
}
