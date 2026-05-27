import { Activity, Building2, Layers3, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { modules } from "@/lib/modules";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function DashboardPage() {
  const { organizationContext } = await requireOrganizationContext();
  const enabledModules = modules.filter((module) => module.status === "enabled").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`A command center for ${organizationContext.activeOrganization.name}, tenant operations, and enabled modules.`}
        actions={<ButtonLink href="/dashboard/modules">Manage modules</ButtonLink>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={`${organizationContext.organizations.length}`} detail="Tenant switching ready" icon={Building2} />
        <StatCard label="Your role" value={organizationContext.activeMembership.role} detail="Organization-scoped access" icon={UsersRound} />
        <StatCard label="Enabled modules" value={`${enabledModules}`} detail="Frontend module controls ready" icon={Layers3} />
        <StatCard label="Audit events" value="0" detail="Backend event stream pending" icon={Activity} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Implementation roadmap</CardTitle>
            <CardDescription>
              Core screens are ready for Supabase tenant data, authentication, and permission checks.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3 p-5 pt-0">
            {["Supabase auth", "Organization membership", "Role policies", "Module provisioning"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
                <span className="text-sm font-medium">{item}</span>
                <span className="text-xs text-muted-foreground">Next phase</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant posture</CardTitle>
            <CardDescription>
              Organization scope, roles, permissions, and audit access are modeled in typed primitives.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
