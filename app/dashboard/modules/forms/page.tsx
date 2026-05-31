import type { ComponentType } from "react";
import { ClipboardList, ExternalLink, FileText, Inbox, ListChecks } from "lucide-react";
import { FormCreateForm } from "@/components/dashboard/form-create-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function FormsModulePage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;

  const [
    { data: forms },
    { data: fields },
    { data: submissions },
    { count: totalForms },
    { count: totalSubmissions },
  ] = await Promise.all([
    supabase
      .from("forms")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("form_fields")
      .select("*")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("form_submissions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("forms")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  const fieldsByFormId = new Map<string, typeof fields>();
  for (const field of fields ?? []) {
    const currentFields = fieldsByFormId.get(field.form_id) ?? [];
    fieldsByFormId.set(field.form_id, [...currentFields, field]);
  }

  const formsById = new Map((forms ?? []).map((form) => [form.id, form]));

  return (
    <>
      <PageHeader
        title="Forms"
        description={`Build forms and review submissions for ${organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name}.`}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard icon={ClipboardList} label="Total forms" value={totalForms ?? 0} detail="Organization form library" />
            <MetricCard icon={Inbox} label="Submissions" value={totalSubmissions ?? 0} detail="Captured responses" />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Forms library</CardTitle>
                  <CardDescription>Active and draft forms with field structure and share placeholders.</CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="space-y-3 p-5 pt-0">
              {(forms ?? []).length ? (
                forms?.map((form) => {
                  const formFields = fieldsByFormId.get(form.id) ?? [];

                  return (
                    <article key={form.id} className="rounded-xl border bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{form.title}</h3>
                            <Badge className="capitalize">{form.status}</Badge>
                          </div>
                          {form.description ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description}</p>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">Created {new Date(form.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {formFields.length ? (
                          formFields.map((field) => (
                            <Badge key={field.id} className="capitalize">
                              {field.label} · {field.field_type}
                            </Badge>
                          ))
                        ) : (
                          <Badge>No fields</Badge>
                        )}
                      </div>
                      <div className="mt-4 rounded-xl border border-dashed bg-white p-3 text-sm text-muted-foreground dark:bg-zinc-950">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Public share link placeholder
                        </div>
                        <code className="mt-2 block overflow-x-auto text-xs">/forms/{form.slug}</code>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 font-medium">No forms yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create your first form to start collecting structured information.</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription>Latest responses captured for organization forms.</CardDescription>
            </CardHeader>
            <div className="divide-y px-5 pb-5">
              {(submissions ?? []).length ? (
                submissions?.map((submission) => {
                  const form = formsById.get(submission.form_id);

                  return (
                    <div key={submission.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{form?.title ?? "Unknown form"}</p>
                        <span className="text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {submission.submitter_email ?? "Internal submission"} · {submission.id.slice(0, 8)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No submissions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Submissions will appear here after public collection is connected.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <FormCreateForm />
          <Card>
            <CardHeader>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <ListChecks className="h-5 w-5" />
              </div>
              <CardTitle>Submission view ready</CardTitle>
              <CardDescription>
                Forms, fields, submissions, and values are modeled separately so public collection and exports can be added cleanly.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{detail}</p>
    </Card>
  );
}
