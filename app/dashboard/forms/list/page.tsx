import { BarChart3, ClipboardList, ExternalLink, Inbox, Pencil } from "lucide-react";
import { FormLifecycleActions } from "@/components/dashboard/forms/form-lifecycle-actions";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getPublicFormUrl } from "@/lib/app-url";
import { formsNavItems } from "@/lib/module-nav";
import type { FormStatus } from "@/types/database";

export default async function FormsListPage({ searchParams }: { searchParams?: Promise<{ status?: string; deleted?: string; error?: string }> }) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const params = (await searchParams) ?? {};
  const statusFilter: "active" | "all" | FormStatus =
    params.status === "draft" || params.status === "published" || params.status === "archived"
      ? params.status
      : params.status === "all"
        ? "all"
        : "active";
  let formsQuery = supabase
    .from("forms")
    .select("id, title, description, status, slug, form_type, anonymous_responses, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter === "active") {
    formsQuery = formsQuery.neq("status", "archived");
  } else if (statusFilter !== "all") {
    formsQuery = formsQuery.eq("status", statusFilter);
  }

  const { data: forms } = await formsQuery;
  const formIds = (forms ?? []).map((form) => form.id);
  const { data: fields } = formIds.length
    ? await supabase
        .from("form_fields")
        .select("id, form_id, label, field_type, sort_order")
        .eq("organization_id", organizationId)
        .in("form_id", formIds)
        .order("sort_order", { ascending: true })
    : { data: [] };
  const { data: submissions } = formIds.length
    ? await supabase
        .from("form_submissions")
        .select("id, form_id, created_at")
        .eq("organization_id", organizationId)
        .in("form_id", formIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [] };
  const fieldsByFormId = new Map<string, typeof fields>();
  const submissionStats = new Map<string, { count: number; latest: string | null }>();

  for (const field of fields ?? []) {
    fieldsByFormId.set(field.form_id, [...(fieldsByFormId.get(field.form_id) ?? []), field]);
  }

  for (const submission of submissions ?? []) {
    const current = submissionStats.get(submission.form_id) ?? { count: 0, latest: null };
    submissionStats.set(submission.form_id, {
      count: current.count + 1,
      latest: current.latest ?? submission.created_at,
    });
  }

  return (
    <>
      <ModuleHeader
        title="Forms"
        description="Forms and surveys with publishing, sharing, and responses."
        items={formsNavItems}
        action={{ href: "/dashboard/forms/create", label: "Create new" }}
      />
      <Toast show={params.deleted === "1"} title="Form deleted" message="The public link was disabled. Existing submissions were kept." />
      <Toast show={Boolean(params.error)} tone="error" title="Form action failed" message="Please refresh and try again." />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Form library</CardTitle>
              <CardDescription>Manage forms, surveys, and public links.</CardDescription>
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <form className="flex flex-col gap-3 p-5 pt-0 sm:flex-row sm:items-center">
          <select name="status" defaultValue={statusFilter} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            <option value="active">Active forms</option>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">Filter</button>
        </form>
        <div className="space-y-3 p-5 pt-0">
          {(forms ?? []).length ? forms?.map((form) => {
            const formFields = fieldsByFormId.get(form.id) ?? [];
            const publicUrl = getPublicFormUrl(form.slug);
            const stats = submissionStats.get(form.id);

            return (
              <article key={form.id} className="rounded-xl border bg-zinc-50 p-4 transition hover:bg-white hover:shadow-sm dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{form.title}</h3>
                      <Badge className={form.form_type === "survey" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : ""}>
                        {form.form_type === "survey" ? "Survey" : "Form"}
                      </Badge>
                      <Badge>{form.status === "published" || form.status === "active" ? "Published" : form.status === "draft" ? "Draft" : "Archived"}</Badge>
                      {form.anonymous_responses ? <Badge>Anonymous</Badge> : null}
                    </div>
                    {form.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description}</p> : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{stats?.count ?? 0} responses</p>
                    <p>{stats?.latest ? `Latest ${new Date(stats.latest).toLocaleString()}` : "No activity yet"}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {formFields.length ? formFields.map((field) => (
                    <Badge key={field.id} className="capitalize">{field.label} - {field.field_type}</Badge>
                  )) : <Badge>No fields</Badge>}
                </div>
                <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-muted-foreground dark:bg-zinc-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />Public link</div>
                      <code className="mt-2 block overflow-x-auto text-xs">{publicUrl}</code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink href={form.form_type === "survey" ? `/dashboard/forms/${form.id}/results` : `/dashboard/forms/submissions?formId=${form.id}`} variant="secondary" className="h-9 px-3">
                        {form.form_type === "survey" ? <BarChart3 className="h-4 w-4" /> : <Inbox className="h-4 w-4" />}
                        {form.form_type === "survey" ? "Results" : "Inbox"}
                      </ButtonLink>
                      <ButtonLink href={`/dashboard/forms/${form.id}/edit`} variant="secondary" className="h-9 px-3">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </ButtonLink>
                      <ButtonLink href={publicUrl} variant="secondary" className="h-9 px-3" target="_blank" aria-disabled={form.status !== "published"}>
                        Open
                      </ButtonLink>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <FormLifecycleActions formId={form.id} status={form.status} />
                </div>
              </article>
            );
          }) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-medium">No forms yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a form or survey to start collecting responses.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
