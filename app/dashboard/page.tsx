import type { ComponentType } from "react";
import { Building2, CheckCircle2, ClipboardList, Inbox, Layers3, MailPlus, Plus, QrCode, ScanLine, UserRoundCheck, UsersRound } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/lib/modules";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function DashboardPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const activeModules = modules.filter((module) => module.status === "enabled");
  const enabledModules = activeModules.length;
  const organizationName =
    organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name;
  const organizationLogo =
    organizationContext.activeOrganization.logoUrl ?? organizationContext.activeOrganization.avatarUrl;
  const accentColor = organizationContext.activeOrganization.accentColor ?? "#111827";
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: totalQrItems },
    { count: todayCheckins },
    { count: teamMembers },
    { count: totalMembers },
    { count: activeMembers },
    { data: recentMembers },
    { count: totalForms },
    { data: recentSubmissions },
    { data: activityEvents },
  ] = await Promise.all([
    supabase
      .from("qr_items")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id),
    supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id)
      .eq("status", "active"),
    supabase
      .from("members")
      .select("id, name, type, status, created_at")
      .eq("organization_id", organizationContext.activeOrganization.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("forms")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationContext.activeOrganization.id),
    supabase
      .from("form_submissions")
      .select("id, form_id, submitter_email, created_at")
      .eq("organization_id", organizationContext.activeOrganization.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("activity_events")
      .select("id, type, title, description, created_at")
      .eq("organization_id", organizationContext.activeOrganization.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`A command center for ${organizationName}, tenant operations, and enabled modules.`}
        actions={<ButtonLink href="/dashboard/modules">Manage modules</ButtonLink>}
      />

      <section className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_18rem] lg:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <OrganizationAvatar name={organizationName} avatarUrl={organizationLogo} className="h-16 w-16" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-semibold tracking-tight">{organizationName}</h2>
                <Badge className="capitalize">{organizationContext.activeMembership.role}</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Organization-scoped workspace for QR operations, member access, modules, and activity visibility.
              </p>
              <div className="mt-4 h-2 max-w-md rounded-full" style={{ backgroundColor: accentColor }} />
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Workspace slug</span>
              <span className="max-w-36 truncate text-sm font-medium">{organizationContext.activeOrganization.slug}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team users</span>
              <span className="text-sm font-medium">{teamMembers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active modules</span>
              <span className="text-sm font-medium">{enabledModules}</span>
            </div>
            <ButtonLink href="/dashboard/settings" variant="secondary" className="h-10 w-full">
              <Building2 className="h-4 w-4" />
              Edit branding
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="QR items" value={`${totalQrItems ?? 0}`} detail="Active QR inventory" icon={QrCode} />
        <StatCard label="Check-ins today" value={`${todayCheckins ?? 0}`} detail="Since local midnight" icon={CheckCircle2} />
        <StatCard label="Total members" value={`${totalMembers ?? 0}`} detail={`${activeMembers ?? 0} active records`} icon={UsersRound} />
        <StatCard label="Forms" value={`${totalForms ?? 0}`} detail={`${recentSubmissions?.length ?? 0} recent submissions`} icon={ClipboardList} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ActivityFeed events={activityEvents ?? []} />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup checklist</CardTitle>
              <CardDescription>Keep moving toward a useful first workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ChecklistItem done={(totalQrItems ?? 0) > 0} label="Create first QR item" href="/dashboard/modules/qr-checkins#create-qr" />
              <ChecklistItem done={(totalMembers ?? 0) > 0} label="Add first member" href="/dashboard/modules/members#add-member" />
              <ChecklistItem done={(teamMembers ?? 0) > 1} label="Invite team member" href="/dashboard/team" />
              <ChecklistItem done={Boolean(organizationContext.activeOrganization.logoUrl || organizationContext.activeOrganization.accentColor)} label="Customize branding" href="/dashboard/settings" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active modules</CardTitle>
              <CardDescription>Available surfaces for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeModules.map((module) => (
                <div key={module.id} className="flex items-center justify-between rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
                  <div>
                    <p className="text-sm font-medium">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.category}</p>
                  </div>
                  {module.href ? (
                    <ButtonLink href={module.href} variant="ghost" className="h-8 px-2">
                      Open
                    </ButtonLink>
                  ) : (
                    <Badge>Active</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent members</CardTitle>
              <CardDescription>Newest member records in this organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentMembers ?? []).length ? (
                recentMembers?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{member.type} • {member.status}</p>
                    </div>
                    <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <p className="text-sm font-medium">No members yet</p>
                  <ButtonLink href="/dashboard/modules/members#add-member" variant="ghost" className="mt-2 h-8">
                    Add first member
                  </ButtonLink>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription>Latest form responses across active forms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentSubmissions ?? []).length ? (
                recentSubmissions?.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between gap-3 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{submission.submitter_email ?? "Internal submission"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleString()}</p>
                    </div>
                    <Inbox className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <p className="text-sm font-medium">No form submissions yet</p>
                  <ButtonLink href="/dashboard/modules/forms#create-form" variant="ghost" className="mt-2 h-8">
                    Create first form
                  </ButtonLink>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Jump into the common workflows for today.</CardDescription>
            </CardHeader>
            <div className="grid gap-3 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <QuickAction href="/dashboard/modules/qr-checkins#create-qr" icon={Plus} label="Create QR item" />
              <QuickAction href="/dashboard/modules/qr-checkins/scanner" icon={ScanLine} label="Open scanner" />
              <QuickAction href="/dashboard/team" icon={MailPlus} label="Invite member" />
              <QuickAction href="/dashboard/modules" icon={Layers3} label="Manage modules" />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational posture</CardTitle>
              <CardDescription>
                Tenant-scoped metrics, check-ins, and activity are live for the active organization.
              </CardDescription>
            </CardHeader>
            <div className="space-y-3 p-5 pt-0">
              {["Supabase auth", "Organization membership", "Role policies", "QR scanner"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-sm font-medium">{item}</span>
                  <span className="text-xs text-muted-foreground">Ready</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <ButtonLink href={href} variant="ghost" className="h-11 w-full justify-start px-2">
      <span className={done ? "grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "grid h-7 w-7 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900"}>
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <span className={done ? "text-muted-foreground line-through" : ""}>{label}</span>
    </ButtonLink>
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
    <ButtonLink href={href} variant="secondary" className="h-12 justify-start px-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </ButtonLink>
  );
}
