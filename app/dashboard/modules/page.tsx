import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleCard } from "@/components/dashboard/module-card";
import { Badge } from "@/components/ui/badge";
import { modules } from "@/lib/modules";

const categories = ["Operations", "Engagement", "Commerce", "Workspace", "Facilities"] as const;

export default function ModulesPage() {
  const activeModules = modules.filter((module) => module.status === "enabled").length;
  const comingSoonModules = modules.length - activeModules;

  return (
    <>
      <PageHeader
        title="Module Marketplace"
        description="Choose focused HofAdmin modules for the workflows your organization actually runs."
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
              <Badge>{comingSoonModules} coming soon</Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">A modular operations suite</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Start with QR operations and member access, then add inventory, bookings, tasks, visitor flows, equipment, and lunch coordination as the workspace matures.
            </p>
          </div>
          <div className="mx-5 mb-5 rounded-xl border bg-zinc-50 p-4 text-sm leading-6 text-muted-foreground dark:bg-zinc-900/60 md:mb-0 md:mr-5 md:max-w-sm">
            Active modules respect organization scope and existing RLS. Coming soon modules are staged for future enablement.
          </div>
        </div>
      </section>
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryModules = modules.filter((module) => module.category === category);

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
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
