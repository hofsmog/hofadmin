import type { ComponentType } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Package,
  Puzzle,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAdminAccess } from "@/lib/auth/role-destinations";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { isModuleEnabled } from "@/lib/modules";

type AttentionItem = {
  label: string;
  count: number;
  href: string;
  icon: ComponentType<{ className?: string }>;
  tone: "red" | "amber" | "emerald" | "sky" | "zinc";
  description: string;
};

type OverviewItem = {
  label: string;
  value: number;
  href: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
};

export default async function DashboardPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const role = organizationContext.activeMembership.role;

  if (!hasAdminAccess(role)) {
    redirect("/app/my-pages");
  }

  const organization = organizationContext.activeOrganization;
  const organizationId = organization.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.toISOString().slice(0, 10);
  const enabledModules = new Set(organization.enabledModules ?? organization.starterModules ?? []);
  const moduleEnabled = (moduleId: string) => moduleId === "dashboard" || isModuleEnabled(moduleId, organization);

  const [
    { count: memberCount, error: memberCountError },
    { count: formCount, error: formCountError },
    { count: newResponses, error: newResponsesError },
    { count: responsesNeedingHandling, error: handlingError },
    { count: pendingInvitations, error: pendingInvitationsError },
    { count: overdueLoans, error: overdueLoansError },
    { count: inventoryAlerts, error: inventoryAlertsError },
    { count: openIssues, error: openIssuesError },
    { count: newFaultReports, error: newFaultReportsError },
    { count: todayCheckins, error: checkinsError },
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("forms").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("read_status", "new"),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("handling_status", ["unhandled", "partially_handled"]),
    supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("inventory_loans")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .lt("due_date", todayDate),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["maintenance", "lost"]),
    supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["new", "in_progress", "waiting"]),
    supabase
      .from("fault_reports")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "new"),
    supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", today.toISOString()),
  ]);

  logDashboardError("members", memberCountError);
  logDashboardError("forms", formCountError);
  logDashboardError("new responses", newResponsesError);
  logDashboardError("response handling", handlingError);
  logDashboardError("pending invitations", pendingInvitationsError);
  logDashboardError("overdue loans", overdueLoansError);
  logDashboardError("inventory alerts", inventoryAlertsError);
  logDashboardError("open issues", openIssuesError);
  logDashboardError("fault reports", newFaultReportsError);
  logDashboardError("checkins", checkinsError);

  const setupItems = [
    {
      label: "Add first member",
      done: (memberCount ?? 0) > 0,
      href: "/dashboard/members/create",
      description: "Create or invite the first person connected to this organization.",
      icon: UserPlus,
    },
    {
      label: "Create first form",
      done: (formCount ?? 0) > 0,
      href: "/dashboard/forms/new",
      description: "Start collecting requests, applications, or reports.",
      icon: ClipboardList,
    },
    {
      label: "Enable modules",
      done: enabledModules.size > 0,
      href: "/dashboard/modules",
      description: "Choose the tools this organization actually uses.",
      icon: Puzzle,
    },
  ];
  const isNewOrganization = setupItems.some((item) => !item.done);

  const attentionItems = [
    {
      label: "New form responses",
      count: moduleEnabled("forms") ? newResponses ?? 0 : 0,
      href: "/dashboard/forms/submissions?readStatus=new",
      icon: Inbox,
      tone: "emerald",
      description: "Unread responses waiting for review.",
    },
    {
      label: "Responses needing handling",
      count: moduleEnabled("forms") ? responsesNeedingHandling ?? 0 : 0,
      href: "/dashboard/forms/submissions?handlingStatus=unhandled",
      icon: ClipboardList,
      tone: "amber",
      description: "Responses marked unhandled or partly handled.",
    },
    {
      label: "Pending invitations",
      count: pendingInvitations ?? 0,
      href: "/dashboard/settings/team?tab=invitations",
      icon: UserPlus,
      tone: "sky",
      description: "Invites that have not been accepted yet.",
    },
    {
      label: "Overdue loans",
      count: moduleEnabled("inventory") ? overdueLoans ?? 0 : 0,
      href: "/dashboard/inventory/loans",
      icon: Package,
      tone: "red",
      description: "Borrowed items past their due date.",
    },
    {
      label: "Inventory alerts",
      count: moduleEnabled("inventory") ? inventoryAlerts ?? 0 : 0,
      href: "/dashboard/inventory/items",
      icon: AlertCircle,
      tone: "amber",
      description: "Items marked maintenance or lost.",
    },
    {
      label: "Open issues",
      count: moduleEnabled("issues") ? openIssues ?? 0 : 0,
      href: "/dashboard/issues",
      icon: AlertCircle,
      tone: "zinc",
      description: "Issues waiting for follow-up.",
    },
    {
      label: "New fault reports",
      count: moduleEnabled("fault-reports") ? newFaultReports ?? 0 : 0,
      href: "/dashboard/fault-reports",
      icon: Bell,
      tone: "red",
      description: "Fault reports not reviewed yet.",
    },
  ] satisfies AttentionItem[];
  const visibleAttentionItems = attentionItems.filter((item) => item.count > 0);

  const overviewItems = [
    {
      label: "Members",
      value: memberCount ?? 0,
      href: "/dashboard/members",
      icon: UsersRound,
      description: "People records in this organization.",
    },
    {
      label: "Forms",
      value: moduleEnabled("forms") ? formCount ?? 0 : 0,
      href: "/dashboard/forms",
      icon: ClipboardList,
      description: "Forms ready to manage.",
    },
    {
      label: "Check-ins today",
      value: moduleEnabled("qr-checkins") ? todayCheckins ?? 0 : 0,
      href: "/dashboard/qr/check-ins",
      icon: CheckCircle2,
      description: "Attendance activity recorded today.",
    },
  ].filter((item) => item.value > 0) satisfies OverviewItem[];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <main className="space-y-6">
        <section className="rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-950">
          <Badge className="capitalize">{role}</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {isNewOrganization ? "Set up your organization" : "Admin dashboard"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isNewOrganization
              ? "Finish the basics first. The dashboard will stay focused on what matters next."
              : "A quiet overview of the work that matters right now."}
          </p>
        </section>

        {isNewOrganization ? <OnboardingChecklist items={setupItems} /> : null}

        {!isNewOrganization && overviewItems.length ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Useful overview</h2>
              <p className="text-sm text-muted-foreground">Only active areas with data are shown.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {overviewItems.map((item) => (
                <OverviewCard key={item.label} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {!isNewOrganization && !overviewItems.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Nothing to summarize yet</CardTitle>
              <CardDescription>
                Add members, create forms, or enable modules. Empty statistics stay hidden until there is useful data.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Manage organization</h2>
            <p className="text-sm text-muted-foreground">The shortest paths to common admin work.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AdminShortcut href="/dashboard/members" icon={UsersRound} label="Team and members" />
            <AdminShortcut href="/dashboard/forms" icon={ClipboardList} label="Forms and responses" />
            <AdminShortcut href="/dashboard/modules" icon={Puzzle} label="Modules" />
          </div>
        </section>
      </main>

      <AttentionCenter items={visibleAttentionItems} />
    </div>
  );
}

function OnboardingChecklist({
  items,
}: {
  items: Array<{
    label: string;
    done: boolean;
    href: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding checklist</CardTitle>
        <CardDescription>Complete these basics to make HofAdmin useful for your team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <ButtonLink
              key={item.label}
              href={item.href}
              variant="ghost"
              className="h-auto w-full justify-start rounded-xl bg-zinc-50 p-3 text-left dark:bg-zinc-900/60"
            >
              <span className={item.done ? "text-emerald-600" : "text-zinc-500"}>
                {item.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
              </span>
              <Badge>{item.done ? "Done" : "Next"}</Badge>
            </ButtonLink>
          );
        })}
      </CardContent>
    </Card>
  );
}

function OverviewCard({ item }: { item: OverviewItem }) {
  const Icon = item.icon;

  return (
    <ButtonLink href={item.href} variant="secondary" className="h-auto justify-start rounded-xl p-4 text-left">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold">{item.value}</span>
        <span className="block text-sm font-medium">{item.label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
      </span>
    </ButtonLink>
  );
}

function AdminShortcut({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <ButtonLink href={href} variant="secondary" className="h-14 justify-start rounded-xl px-4">
      <Icon className="h-4 w-4" />
      {label}
    </ButtonLink>
  );
}

function AttentionCenter({ items }: { items: AttentionItem[] }) {
  return (
    <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Attention Center</h2>
        <p className="text-sm text-muted-foreground">Only items that need action or review.</p>
      </div>
      <Card>
        <CardContent className="space-y-2 p-3">
          {items.length ? (
            items.map((item) => <AttentionCenterItem key={item.label} item={item} />)
          ) : (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              Everything looks good. No items need your attention.
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function AttentionCenterItem({ item }: { item: AttentionItem }) {
  const Icon = item.icon;

  return (
    <ButtonLink
      href={item.href}
      variant="ghost"
      className="h-auto w-full justify-start rounded-xl bg-zinc-50 p-3 text-left dark:bg-zinc-900/60"
    >
      <span className={getToneClass(item.tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
      </span>
      <Badge>{item.count}</Badge>
    </ButtonLink>
  );
}

function getToneClass(tone: AttentionItem["tone"]) {
  const tones = {
    red: "text-red-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    sky: "text-sky-600",
    zinc: "text-zinc-600 dark:text-zinc-300",
  };

  return tones[tone];
}

function logDashboardError(label: string, error: { message: string } | null) {
  if (!error) {
    return;
  }

  console.error("[dashboard] Could not load dashboard data.", {
    area: label,
    error: error.message,
  });
}
