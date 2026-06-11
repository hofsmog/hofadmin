import { UsersRound } from "lucide-react";
import { createOrganizationGroupAction } from "@/app/app/groups/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type OrganizationGroup = Database["public"]["Tables"]["organization_groups"]["Row"];
type GroupMember = Pick<Database["public"]["Tables"]["organization_group_members"]["Row"], "group_id">;

export default async function GroupsPage() {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const canManageGroups = ["owner", "admin", "manager"].includes(organizationContext.activeMembership.role);
  const { data: groups, error } = await supabase
    .from("organization_groups")
    .select("id, organization_id, name, description, created_by, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[groups] Could not load groups", {
      organizationId,
      userId: user.id,
      error,
    });
  }

  const groupIds = (groups ?? []).map((group) => group.id);
  const { data: groupMembers, error: membersError } = groupIds.length
    ? await supabase
        .from("organization_group_members")
        .select("group_id")
        .eq("organization_id", organizationId)
        .in("group_id", groupIds)
    : { data: [], error: null };

  if (membersError) {
    console.error("[groups] Could not load group member counts", {
      organizationId,
      userId: user.id,
      error: membersError,
    });
  }

  const memberCounts = countMembersByGroup((groupMembers ?? []) as GroupMember[]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <Badge>{getOrganizationName(organizationContext.activeOrganization)}</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Groups</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Create teams like IT, Maintenance, Teachers or Management for permissions, assignments and future workflows.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {(groups ?? []).length ? (
            ((groups ?? []) as OrganizationGroup[]).map((group) => (
              <ButtonLink key={group.id} href={`/app/groups/${group.id}`} variant="secondary" className="h-auto w-full justify-start rounded-2xl p-4 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <UsersRound className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{group.name}</span>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">{group.description || "No description yet"}</span>
                </span>
                <Badge>{memberCounts.get(group.id) ?? 0} members</Badge>
              </ButtonLink>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <UsersRound className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">No groups yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Create your first group to organize people by team or responsibility.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {canManageGroups ? (
          <Card>
            <CardHeader>
              <CardTitle>Create group</CardTitle>
              <CardDescription>Add a team inside this organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createOrganizationGroupAction} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Group name</span>
                  <Input name="name" required minLength={2} maxLength={80} placeholder="Maintenance" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="What this group is responsible for"
                    className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  />
                </label>
                <ActionSubmitButton pendingLabel="Creating">Create group</ActionSubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function countMembersByGroup(members: GroupMember[]) {
  const counts = new Map<string, number>();

  for (const member of members) {
    counts.set(member.group_id, (counts.get(member.group_id) ?? 0) + 1);
  }

  return counts;
}

function getOrganizationName(organization: Awaited<ReturnType<typeof requireOrganizationContext>>["organizationContext"]["activeOrganization"]) {
  const name = organization.displayName?.trim() || organization.name?.trim() || "";

  return name || "Your organization";
}
