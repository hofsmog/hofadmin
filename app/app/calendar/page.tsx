import { CalendarDays, Clock, Plus } from "lucide-react";
import { createCalendarEventAction } from "@/app/app/calendar/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { createMessageNameMap, type MessageTeamMember } from "@/lib/messages";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: MessageTeamMember[] | null; error: { message: string } | null }>;
};

export default async function AppCalendarPage() {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const canManageCalendar = organizationContext.activeMembership.role === "owner" || organizationContext.activeMembership.role === "admin";
  const now = new Date();
  const { data: events, error } = await supabase
    .from("calendar_events")
    .select("id, organization_id, title, description, start_at, end_at, event_type, assigned_to, created_by, source_type, source_id, visibility, created_at, updated_at")
    .eq("organization_id", organizationId)
    .gte("start_at", now.toISOString())
    .order("start_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[app/calendar] Could not load calendar events", {
      organizationId,
      userId: user.id,
      error,
    });
  }

  const { data: teamMembers, error: teamError } = await (supabase as unknown as TeamMemberRpcClient).rpc(
    "list_organization_team_members",
    { p_organization_id: organizationId },
  );

  if (teamError) {
    console.error("[app/calendar] Could not load team members", {
      organizationId,
      userId: user.id,
      error: teamError,
    });
  }

  const nameByUserId = createMessageNameMap(teamMembers ?? []);
  const groupedEvents = groupEvents((events ?? []) as CalendarEvent[], now);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <Badge>{getOrganizationName(organizationContext.activeOrganization)}</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Your upcoming work items, reminders and organization events in one place.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <CalendarGroup title="Today" events={groupedEvents.today} nameByUserId={nameByUserId} />
          <CalendarGroup title="This week" events={groupedEvents.thisWeek} nameByUserId={nameByUserId} />
          <CalendarGroup title="Later" events={groupedEvents.later} nameByUserId={nameByUserId} />
          {!(events ?? []).length ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">No upcoming calendar items</p>
                <p className="mt-1 text-sm text-muted-foreground">Events, reminders and due dates will appear here.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {canManageCalendar ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Create event</CardTitle>
                  <CardDescription>Add a simple calendar item for a person or the whole organization.</CardDescription>
                </div>
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <form action={createCalendarEventAction} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Title</span>
                  <Input name="title" maxLength={160} required placeholder="Training session" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Optional notes"
                    className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Start</span>
                    <Input name="startAt" type="datetime-local" required />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">End</span>
                    <Input name="endAt" type="datetime-local" />
                  </label>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Visibility</span>
                  <select name="visibility" defaultValue="assigned" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950">
                    <option value="assigned">Assigned person</option>
                    <option value="organization">Whole organization</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Assigned user</span>
                  <select name="assignedTo" defaultValue="" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950">
                    <option value="">No specific person</option>
                    {(teamMembers ?? []).map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.display_name?.trim() || "Team member"}
                      </option>
                    ))}
                  </select>
                </label>
                <ActionSubmitButton pendingLabel="Creating">Create event</ActionSubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function CalendarGroup({
  title,
  events,
  nameByUserId,
}: {
  title: string;
  events: CalendarEvent[];
  nameByUserId: Map<string, string>;
}) {
  if (!events.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{events.length} upcoming item{events.length === 1 ? "" : "s"}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((event) => (
          <article key={event.id} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.title}</p>
                {event.description ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{event.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{event.visibility === "organization" ? "Organization" : "Assigned"}</Badge>
                  {event.assigned_to ? <Badge>{nameByUserId.get(event.assigned_to) ?? "Team member"}</Badge> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatEventTime(event)}</span>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function groupEvents(events: CalendarEvent[], now: Date) {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    today: events.filter((event) => new Date(event.start_at) <= endOfToday),
    thisWeek: events.filter((event) => {
      const date = new Date(event.start_at);
      return date > endOfToday && date <= endOfWeek;
    }),
    later: events.filter((event) => new Date(event.start_at) > endOfWeek),
  };
}

function formatEventTime(event: CalendarEvent) {
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;
  const date = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const startTime = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (!end) {
    return `${date}, ${startTime}`;
  }

  const endTime = end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${startTime}-${endTime}`;
}

function getOrganizationName(organization: Awaited<ReturnType<typeof requireOrganizationContext>>["organizationContext"]["activeOrganization"]) {
  const name = organization.displayName?.trim() || organization.name?.trim() || "";

  return name || "Your organization";
}
