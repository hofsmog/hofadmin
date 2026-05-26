import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleCard } from "@/components/dashboard/module-card";
import { modules } from "@/lib/modules";

export default function ModulesPage() {
  return (
    <>
      <PageHeader
        title="Modules"
        description="Enable and disable modular product surfaces per organization without coupling the core platform to one vertical."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </>
  );
}
