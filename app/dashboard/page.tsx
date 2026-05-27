import type { ComponentType } from "react";
import { CheckCircle2, Layers3, MailPlus, Plus, QrCode, ScanLine, UsersRound } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/lib/modules";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function DashboardPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const enabledModules = modules.filter((module) => module.status === "enabled").length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: totalQrItems },
    { count: todayCheckins },
    { count: activeMembers },
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
        description={`A command center for ${organizationContext.activeOrganization.name}, tenant operations, and enabled modules.`}
        actions={<ButtonLink href="/dashboard/modules">Manage modules</ButtonLink>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="QR items" value={`${totalQrItems ?? 0}`} detail="Active QR inventory" icon={QrCode} />
        <StatCard label="Check-ins today" value={`${todayCheckins ?? 0}`} detail="Since local midnight" icon={CheckCircle2} />
        <StatCard label="Active members" value={`${activeMembers ?? 0}`} detail={`Your role is ${organizationContext.activeMembership.role}`} icon={UsersRound} />
        <StatCard label="Active modules" value={`${enabledModules}`} detail="Operational modules available" icon={Layers3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ActivityFeed events={activityEvents ?? []} />

        <div className="space-y-4">
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
