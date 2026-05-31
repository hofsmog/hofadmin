import { ClipboardList, Inbox, Plus } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: forms }, { data: submissions }, { count: totalForms }, { count: totalSubmissions }] =
    await Promise.all([
      supabase.from("forms").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(5),
      supabase.from("form_submissions").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(5),
      supabase.from("forms").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
      supabase.from("form_submissions").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    ]);
  const formsById = new Map((forms ?? []).map((form) => [form.id, form]));

  return (
    <>
      <ModuleHeader
        title="Forms"
        description="Build structured forms and review incoming submissions."
        items={formsNavItems}
        action={{ href: "/dashboard/forms/create", label: "Create form" }}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total forms" value={`${totalForms ?? 0}`} detail="Organization form library" icon={ClipboardList} />
        <StatCard label="Submissions" value={`${totalSubmissions ?? 0}`} detail="Captured responses" icon={Inbox} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent forms</CardTitle>
            <CardDescription>Newest forms in this workspace.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(forms ?? []).length ? forms?.map((form) => (
              <div key={form.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{form.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{form.status}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(form.created_at).toLocaleDateString()}</span>
              </div>
            )) : <EmptyCopy title="No forms yet" description="Create your first form to start collecting information." />}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
            <CardDescription>Latest response activity.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(submissions ?? []).length ? submissions?.map((submission) => (
              <div key={submission.id} className="py-3">
                <p className="text-sm font-medium">{formsById.get(submission.form_id)?.title ?? "Unknown form"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{submission.submitter_email ?? "Internal submission"} · {new Date(submission.created_at).toLocaleString()}</p>
              </div>
            )) : <EmptyCopy title="No submissions yet" description="Responses will appear here once collection is connected." />}
          </div>
        </Card>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard/forms/create"><Plus className="h-4 w-4" />Create form</ButtonLink>
        <ButtonLink href="/dashboard/forms/submissions" variant="secondary">View submissions</ButtonLink>
      </div>
    </>
  );
}

function EmptyCopy({ title, description }: { title: string; description: string }) {
  return <div className="py-8 text-center"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}
