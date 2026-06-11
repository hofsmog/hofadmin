import { notFound } from "next/navigation";
import { Trash2, UserPlus, UsersRound } from "lucide-react";
import {
  addOrganizationGroupMemberAction,
  deleteOrganizationGroupAction,
  removeOrganizationGroupMemberAction,
  updateOrganizationGroupAction,
} from "@/app/app/groups/actions";
import { GroupMemberPicker } from "@/components/app/groups/member-picker";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { MessageTeamMember } from "@/lib/messages";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type GroupMemberRow = Database["public"]["Tables"]["organization_group_members"]["Row"];

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: MessageTeamMember[] | null; error: { message: string } | null }>;
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const canManageGroups = ["owner", "admin", "manager"].includes(organizationContext.activeMembership.role);
  const { data: group, error } = await supabase
    .from("organization_groups")
    .select("id, organization_id, name, description, created_by, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    console.error("[groups] Could not load group detail", {
      organizationId,
      userId: user.id,
      groupId,
      error,
    });
  }

  if (!group) {
    notFound();
  }

  const [
    { data: groupMembers, error: membersError },
    { data: teamMembers, error: teamError },
  ] = await Promise.all([
    supabase
      .from("organization_group_members")
      .select("id, organization_id, group_id, user_id, added_by, created_at")
      .eq("organization_id", organizationId)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true }),
    (supabase as unknown as TeamMemberRpcClient).rpc(
      "list_organization_team_members",
      { p_organization_id: organizationId },
    ),
  ]);

  if (membersError) {
    console.error("[groups] Could not load group members", {
      organizationId,
      userId: user.id,
      groupId,
      error: membersError,
    });
  }

  if (teamError) {
    console.error("[groups] Could not load team members", {
      organizationId,
      userId: user.id,
      groupId,
      error: teamError,
    });
  }

  const memberships = (groupMembers ?? []) as GroupMemberRow[];
  const team = teamMembers ?? [];
  const memberByUserId = new Map(team.map((teamMember) => [teamMember.user_id, teamMember]));
  const existingUserIds = new Set(memberships.map((member) => member.user_id));
  const availableMembers = team.filter((member) => !existingUserIds.has(member.user_id));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge>{getOrganizationName(organizationContext.activeOrganization)}</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{group.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {group.description || "Group for team membership, assignments and permissions."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageGroups ? (
              <ButtonLink href="#add-members">
                <UserPlus className="h-4 w-4" />
                Add members
              </ButtonLink>
            ) : null}
            <ButtonLink href="/app/groups" variant="secondary">Back to groups</ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>People currently in this group.</CardDescription>
              </div>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships.length ? (
              memberships.map((membership) => (
                <div key={membership.id} className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{getTeamMemberName(memberByUserId.get(membership.user_id))}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[memberByUserId.get(membership.user_id)?.email, `Added ${new Date(membership.created_at).toLocaleDateString()}`].filter(Boolean).join(" - ")}
                    </p>
                  </div>
                  {canManageGroups ? (
                    <form action={removeOrganizationGroupMemberAction}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="membershipId" value={membership.id} />
                      <ActionSubmitButton pendingLabel="Removing">Remove</ActionSubmitButton>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-4">
                <p className="text-sm font-medium">No members in this group yet</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Add people to make this group useful for messages, tasks and permissions.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {canManageGroups ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Edit group</CardTitle>
                  <CardDescription>Keep the group name clear and human-readable.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={updateOrganizationGroupAction} className="space-y-4">
                    <input type="hidden" name="groupId" value={group.id} />
                    <label className="block space-y-2">
                      <span className="text-sm font-medium">Group name</span>
                      <Input name="name" required minLength={2} maxLength={80} defaultValue={group.name} />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium">Description</span>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={group.description ?? ""}
                        className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                      />
                    </label>
                    <ActionSubmitButton pendingLabel="Saving">Save changes</ActionSubmitButton>
                  </form>
                </CardContent>
              </Card>

              <Card id="add-members">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Add members</CardTitle>
                      <CardDescription>Select one or more existing organization members.</CardDescription>
                    </div>
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {team.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-4">
                      <p className="text-sm font-medium">No organization members found. Add members first.</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Invite people to the organization before adding them to groups.</p>
                    </div>
                  ) : availableMembers.length ? (
                    <form action={addOrganizationGroupMemberAction} className="space-y-4">
                      <input type="hidden" name="groupId" value={group.id} />
                      {memberships.length ? (
                        <p className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-muted-foreground dark:bg-zinc-900">
                          {memberships.length} {memberships.length === 1 ? "person is" : "people are"} already in this group and hidden from the picker.
                        </p>
                      ) : null}
                      <GroupMemberPicker members={availableMembers} />
                      <ActionSubmitButton pendingLabel="Adding">Add selected members</ActionSubmitButton>
                    </form>
                  ) : (
                    <div className="rounded-xl border border-dashed p-4">
                      <p className="text-sm font-medium">Everyone is already in this group</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Invite more people to the organization before adding them here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Delete group</CardTitle>
                      <CardDescription>Remove this group and its memberships.</CardDescription>
                    </div>
                    <Trash2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {memberships.length ? (
                    <div className="rounded-xl border border-dashed p-4">
                      <p className="text-sm font-medium">Remove members before deleting</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Groups can be deleted when no people are assigned to them.</p>
                    </div>
                  ) : (
                    <form action={deleteOrganizationGroupAction}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <ActionSubmitButton pendingLabel="Deleting">Delete group</ActionSubmitButton>
                    </form>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getOrganizationName(organization: Awaited<ReturnType<typeof requireOrganizationContext>>["organizationContext"]["activeOrganization"]) {
  const name = organization.displayName?.trim() || organization.name?.trim() || "";

  return name || "Your organization";
}

function getTeamMemberName(member: MessageTeamMember | undefined) {
  return member?.display_name?.trim() || member?.email?.trim() || "Team member";
}
