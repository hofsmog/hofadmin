import { BarChart3, ClipboardList, Inbox } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsAnalyticsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: totalForms }, { count: totalSubmissions }] = await Promise.all([
    supabase.from("forms").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("form_submissions").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
  ]);

  return (
    <>
      <ModuleHeader title="Forms Analytics" description="High-level form activity and future reporting." items={formsNavItems} />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total forms" value={`${totalForms ?? 0}`} detail="Current form library" icon={ClipboardList} />
        <StatCard label="Total submissions" value={`${totalSubmissions ?? 0}`} detail="All captured responses" icon={Inbox} />
      </div>
      <Card className="mt-4">
        <CardHeader>
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <BarChart3 className="h-5 w-5" />
          </div>
          <CardTitle>Analytics coming into focus</CardTitle>
          <CardDescription>
            Response rates, form conversion, field drop-off, and exports can build on the existing forms and submissions tables.
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
