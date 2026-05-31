import type { ComponentType } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Inbox, Package, Plus, ScanLine, UserPlus, UsersRound } from "lucide-react";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/lib/modules";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getRespondentName, groupSubmissionValues } from "@/lib/forms/submissions";

export default async function DashboardPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const organizationName =
    organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name;
  const organizationLogo =
    organizationContext.activeOrganization.logoUrl ?? organizationContext.activeOrganization.avatarUrl;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: todayCheckins },
    { count: totalMembers },
    { count: totalForms },
    { count: totalInventoryItems },
    { count: newSubmissionsCount },
    { data: latestNewSubmissions },
    { count: inventoryNeedsAttention },
    { count: pendingInvitations },
    { data: activityEvents },
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("forms")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("read_status", "new"),
    supabase
      .from("form_submissions")
      .select("id, form_id, submitter_email, read_status, handling_status, created_at")
      .eq("organization_id", organizationId)
      .eq("read_status", "new")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["maintenance", "lost"]),
    supabase
      .from("organization_invitations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("activity_events")
      .select("id, type, title, description, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const latestSubmissionIds = (latestNewSubmissions ?? []).map((submission) => submission.id);
  const formIds = [...new Set((latestNewSubmissions ?? []).map((submission) => submission.form_id))];
  const [{ data: latestSubmissionValues }, { data: submissionForms }] = await Promise.all([
    latestSubmissionIds.length
      ? supabase
          .from("form_submission_values")
          .select("id, submission_id, field_label, value")
          .eq("organization_id", organizationId)
          .in("submission_id", latestSubmissionIds)
      : Promise.resolve({ data: [] }),
    formIds.length
      ? supabase
          .from("forms")
          .select("id, title")
          .eq("organization_id", organizationId)
          .in("id", formIds)
      : Promise.resolve({ data: [] }),
  ]);
  const valuesBySubmissionId = groupSubmissionValues(latestSubmissionValues ?? []);
  const formsById = new Map((submissionForms ?? []).map((form) => [form.id, form.title]));
  const checklistItems = [
    { done: (totalForms ?? 0) > 0, label: "Create your first form", href: "/dashboard/forms/create" },
    { done: (totalMembers ?? 0) > 0, label: "Add your first member", href: "/dashboard/members/create#add-member" },
    { done: (totalInventoryItems ?? 0) > 0, label: "Add your first inventory item", href: "/dashboard/inventory/create" },
    {
      done: Boolean(organizationContext.activeOrganization.logoUrl || organizationContext.activeOrganization.accentColor),
      label: "Customize branding",
      href: "/dashboard/settings",
    },
  ];
  const incompleteChecklist = checklistItems.filter((item) => !item.done);
  const attentionItems = [
    {
      label: "New form submissions",
      value: newSubmissionsCount ?? 0,
      href: "/dashboard/forms/submissions?readStatus=new",
    },
    {
      label: "Inventory alerts",
      value: inventoryNeedsAttention ?? 0,
      href: "/dashboard/inventory/items?status=maintenance",
    },
    {
      label: "Pending invitations",
      value: pendingInvitations ?? 0,
      href: "/dashboard/team",
    },
  ].filter((item) => item.value > 0);
  const coreModules = modules.filter((module) => ["qr-checkins", "forms", "members", "inventory"].includes(module.id));

  return (
    <>
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <OrganizationAvatar name={organizationName} avatarUrl={organizationLogo} className="h-14 w-14" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{organizationName}</h1>
                <Badge className="capitalize">{organizationContext.activeMembership.role}</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                A simple place to see what needs attention and jump into today&apos;s work.
              </p>
            </div>
          </div>
          <ButtonLink href="/dashboard/forms/create" className="shrink-0">
            <Plus className="h-4 w-4" />
            Create form
          </ButtonLink>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New submissions" value={`${newSubmissionsCount ?? 0}`} detail="Unread form responses" icon={Inbox} />
        <StatCard label="Check-ins today" value={`${todayCheckins ?? 0}`} detail="Attendance and access scans" icon={CheckCircle2} />
        <StatCard label="Members" value={`${totalMembers ?? 0}`} detail="People in this organization" icon={UsersRound} />
        <StatCard label="Inventory alerts" value={`${inventoryNeedsAttention ?? 0}`} detail="Maintenance or lost items" icon={AlertTriangle} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Only items that may need a decision or follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {attentionItems.length ? (
                attentionItems.map((item) => (
                  <ButtonLink key={item.label} href={item.href} variant="ghost" className="h-auto w-full justify-between rounded-xl bg-zinc-50 p-3 text-left dark:bg-zinc-900/60">
                    <span className="text-sm font-medium">{item.label}</span>
                    <Badge>{item.value}</Badge>
                  </ButtonLink>
                ))
              ) : (
                <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <p className="text-sm font-semibold">Everything looks good.</p>
                  <p className="mt-1 text-sm opacity-80">No new submissions, inventory alerts, or pending invitations right now.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest organization updates.</CardDescription>
              </div>
              <ButtonLink href="/dashboard/audit-logs" variant="ghost" className="h-8 px-2">
                View all
              </ButtonLink>
            </CardHeader>
            <CardContent className="space-y-2">
              {(activityEvents ?? []).length ? (
                activityEvents?.map((event) => (
                  <div key={event.id} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{event.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                    {event.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create a form, add a member, or add inventory to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>New submissions</CardTitle>
              <CardDescription>Latest unread form responses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(latestNewSubmissions ?? []).length ? (
                latestNewSubmissions?.map((submission) => {
                  const values = valuesBySubmissionId.get(submission.id) ?? [];

                  return (
                    <ButtonLink key={submission.id} href={`/dashboard/forms/submissions/${submission.id}`} variant="ghost" className="h-auto w-full justify-between rounded-xl bg-emerald-50/80 p-3 text-left dark:bg-emerald-950/20">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{getRespondentName(values)}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {formsById.get(submission.form_id) ?? "Unknown form"} - {new Date(submission.created_at).toLocaleString()}
                        </span>
                      </span>
                      <Badge className="ml-3 border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                        New
                      </Badge>
                    </ButtonLink>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No new submissions</p>
                  <p className="mt-1 text-sm text-muted-foreground">Unread responses will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Common things to do next.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <QuickAction href="/dashboard/forms/create" icon={ClipboardList} label="Create form" />
              <QuickAction href="/dashboard/members/create#add-member" icon={UserPlus} label="Add member" />
              <QuickAction href="/dashboard/inventory/create" icon={Package} label="Add inventory item" />
              <QuickAction href="/dashboard/qr/scanner" icon={ScanLine} label="Open scanner" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Active modules</CardTitle>
              <CardDescription>Your main work areas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {coreModules.map((module) => (
                <div key={module.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                  <p className="text-sm font-medium">{module.name}</p>
                  {module.href ? <ButtonLink href={module.href} variant="ghost" className="h-8 px-2">Open</ButtonLink> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {incompleteChecklist.length ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Setup checklist</CardTitle>
                <CardDescription>Finish the basics, then this gets out of your way.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {incompleteChecklist.map((item) => (
                  <ButtonLink key={item.label} href={item.href} variant="ghost" className="h-auto w-full justify-start rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                    {item.label}
                  </ButtonLink>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <ButtonLink href={href} variant="secondary" className="h-11 justify-start px-3">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </ButtonLink>
  );
}
