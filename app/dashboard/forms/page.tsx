import { BarChart3, ClipboardList, Inbox, Plus } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getRespondentName, groupSubmissionValues } from "@/lib/forms/submissions";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [
    { data: forms },
    { data: submissions },
    { data: newSubmissions },
    { count: totalForms },
    { count: totalSurveys },
    { count: unreadSubmissions },
    { count: needsHandling },
  ] = await Promise.all([
    supabase.from("forms").select("id, title, status, form_type, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(5),
    supabase.from("form_submissions").select("id, form_id, submitter_email, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(5),
    supabase.from("form_submissions").select("id, form_id, submitter_email, created_at").eq("organization_id", organizationId).eq("read_status", "new").order("created_at", { ascending: false }).limit(5),
    supabase.from("forms").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("form_type", "form"),
    supabase.from("forms").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("form_type", "survey"),
    supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("read_status", "new"),
    supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("handling_status", ["unhandled", "partially_handled"]),
  ]);
  const formsById = new Map((forms ?? []).map((form) => [form.id, form]));
  const newSubmissionIds = (newSubmissions ?? []).map((submission) => submission.id);
  const { data: newSubmissionValues } = newSubmissionIds.length
    ? await supabase
        .from("form_submission_values")
        .select("id, submission_id, field_label, value")
        .eq("organization_id", organizationId)
        .in("submission_id", newSubmissionIds)
    : { data: [] };
  const valuesBySubmissionId = groupSubmissionValues(newSubmissionValues ?? []);

  return (
    <>
      <ModuleHeader
        title="Forms"
        description="Bygg formulär för inkorgsflöden och undersökningar för sammanställning."
        items={formsNavItems}
        action={{ href: "/dashboard/forms/create", label: "Skapa ny" }}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Formulär" value={`${totalForms ?? 0}`} detail="Inkorg och ärenden" icon={ClipboardList} />
        <StatCard label="Undersökningar" value={`${totalSurveys ?? 0}`} detail="Enkäter och feedback" icon={BarChart3} />
        <StatCard label="Nya svar" value={`${unreadSubmissions ?? 0}`} detail="Olästa formulärsvar" icon={Inbox} />
        <StatCard label="Behöver hanteras" value={`${needsHandling ?? 0}`} detail="Ohanterade eller delhanterade" icon={ClipboardList} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Senaste i Forms</CardTitle>
            <CardDescription>Nya formulär och undersökningar i arbetsytan.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(forms ?? []).length ? forms?.map((form) => (
              <div key={form.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{form.title}</p>
                  <p className="text-xs text-muted-foreground">{form.form_type === "survey" ? "Undersökning" : "Formulär"} · {form.status === "published" ? "Publicerad" : form.status === "draft" ? "Utkast" : "Arkiverad"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(form.created_at).toLocaleDateString()}</span>
              </div>
            )) : <EmptyCopy title="Inget skapat ännu" description="Skapa ett formulär eller en undersökning för att börja samla in svar." />}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Senaste svar</CardTitle>
            <CardDescription>Senaste inkomna aktiviteten.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(submissions ?? []).length ? submissions?.map((submission) => (
              <ButtonLink key={submission.id} href={`/dashboard/forms/submissions/${submission.id}`} variant="ghost" className="h-auto w-full justify-start rounded-none px-0 py-3 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{formsById.get(submission.form_id)?.title ?? "Unknown form"}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{submission.submitter_email ?? "Ingen e-post"} - {new Date(submission.created_at).toLocaleString()}</span>
                </span>
              </ButtonLink>
            )) : <EmptyCopy title="Inga svar ännu" description="Svar visas här när publika formulär används." />}
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Senaste nya svar</CardTitle>
          <CardDescription>Olästa formulärsvar som kan behöva hanteras.</CardDescription>
        </CardHeader>
        <div className="divide-y px-5 pb-5">
          {(newSubmissions ?? []).length ? newSubmissions?.map((submission) => {
            const values = valuesBySubmissionId.get(submission.id) ?? [];

            return (
              <ButtonLink key={submission.id} href={`/dashboard/forms/submissions/${submission.id}`} variant="ghost" className="h-auto w-full justify-between rounded-none px-0 py-3 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{getRespondentName(values)}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{formsById.get(submission.form_id)?.title ?? "Unknown form"}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </ButtonLink>
            );
          }) : <EmptyCopy title="Inga nya svar" description="Nya svar visas här när de kommer in." />}
        </div>
      </Card>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard/forms/create"><Plus className="h-4 w-4" />Skapa ny</ButtonLink>
        <ButtonLink href="/dashboard/forms/submissions" variant="secondary">Visa inkorg</ButtonLink>
      </div>
    </>
  );
}

function EmptyCopy({ title, description }: { title: string; description: string }) {
  return <div className="py-8 text-center"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}
