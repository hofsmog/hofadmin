import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleCard } from "@/components/dashboard/module-card";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import { getModulesForOrganization, getSelectableEnabledModuleIds } from "@/lib/modules";
import { formatLimit, getEffectiveModuleLimit, getModuleLimitMessage, getOrganizationPlan } from "@/lib/plans";

const categories = ["Workspace", "Operations", "Admin"] as const;

export default async function ModulesPage({ searchParams }: { searchParams?: Promise<{ updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { organizationContext } = await requireOrganizationContext();
  const organizationModules = getModulesForOrganization(organizationContext.activeOrganization);
  const canManage = canManageOrganization(organizationContext.activeMembership.role);
  const plan = getOrganizationPlan(organizationContext.activeOrganization);
  const moduleLimit = getEffectiveModuleLimit(organizationContext.activeOrganization);
  const enabledModuleCount = getSelectableEnabledModuleIds(organizationContext.activeOrganization).length;
  const moduleLimitMessage = getModuleLimitMessage(organizationContext.activeOrganization);
  const visibleModules = canManage ? organizationModules : organizationModules.filter((module) => module.status === "enabled");
  const activeModules = visibleModules.filter((module) => module.status === "enabled").length;
  const disabledModules = canManage ? organizationModules.length - organizationModules.filter((module) => module.status === "enabled").length : 0;

  return (
    <>
      <PageHeader
        title="Modules"
        description="Choose the simple work areas your organization uses."
      />
      <Toast show={params.updated === "1"} title="Module settings updated" message="Organization module visibility was saved." />
      <Toast
        show={Boolean(params.error)}
        tone="error"
        title="Module settings not saved"
        message={
          params.error === "permission"
            ? "Only owners and admins can manage modules."
            : params.error === "limit"
              ? moduleLimitMessage ?? "Your current plan includes fewer modules. Upgrade to enable more."
              : "Check the module settings and try again."
        }
      />
      <section className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950">
        <div className="border-b bg-zinc-50 px-5 py-3 dark:bg-zinc-900/60">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category}>{category}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{activeModules} active</Badge>
              <Badge>{`Using ${enabledModuleCount} of ${formatLimit(moduleLimit)} modules`}</Badge>
              <Badge>{`${plan.name} plan`}</Badge>
              {canManage ? <Badge>{disabledModules} disabled</Badge> : null}
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">Start with the modules you actually need</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {canManage ? `You are using ${enabledModuleCount} of ${formatLimit(moduleLimit)} modules on the ${plan.name} plan. Disabled modules stay hidden from the main navigation.` : "Open the modules enabled for your organization."}
            </p>
          </div>
          <div className="mx-5 mb-5 rounded-xl border bg-zinc-50 p-4 text-sm leading-6 text-muted-foreground dark:bg-zinc-900/60 md:mb-0 md:mr-5 md:max-w-sm">
            Dashboard, Settings, Branding, Notifications, and Activity Feed stay available so the workspace remains easy to manage.
          </div>
        </div>
      </section>
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryModules = visibleModules.filter((module) => module.category === category);

          if (!categoryModules.length) {
            return null;
          }

          return (
            <section key={category}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{category}</h2>
                  <p className="text-sm text-muted-foreground">{categoryModules.length} modules</p>
                </div>
                <Badge>{categoryModules.filter((module) => module.status === "enabled").length} active</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categoryModules.map((module) => (
                  <ModuleCard key={module.id} module={module} canManage={canManage} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
