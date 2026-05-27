import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleCard } from "@/components/dashboard/module-card";
import { Badge } from "@/components/ui/badge";
import { modules } from "@/lib/modules";

export default function ModulesPage() {
  const activeModules = modules.filter((module) => module.status === "enabled").length;
  const comingSoonModules = modules.length - activeModules;

  return (
    <>
      <PageHeader
        title="Module Marketplace"
        description="Choose focused HofAdmin modules for the workflows your organization actually runs."
      />
      <section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{activeModules} active</Badge>
              <Badge>{comingSoonModules} coming soon</Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">A modular operations suite</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Start with QR operations and member access, then add inventory, bookings, tasks, visitor flows, equipment, and lunch coordination as the workspace matures.
            </p>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-4 text-sm leading-6 text-muted-foreground dark:bg-zinc-900/60">
            Active modules respect organization scope and existing RLS. Coming soon modules are staged for future enablement.
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </>
  );
}
