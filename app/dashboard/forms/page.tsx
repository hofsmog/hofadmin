import { BarChart3, ClipboardList, ExternalLink, Inbox, Pencil, Plus } from "lucide-react";
import { FormLifecycleActions } from "@/components/dashboard/forms/form-lifecycle-actions";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { getPublicFormUrl } from "@/lib/app-url";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";
import type { FormStatus } from "@/types/database";

type FormCardRow = {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  slug: string;
  form_type: "form" | "survey";
  anonymous_responses: boolean;
  created_at: string;
};

export default async function FormsPage({ searchParams }: { searchParams?: Promise<{ status?: string; deleted?: string; error?: string; updated?: string }> }) {
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

  const [{ data: forms }, { data: activeFormsForCounters }] = await Promise.all([
    formsQuery,
    supabase.from("forms").select("id").eq("organization_id", organizationId).neq("status", "archived"),
  ]);

  const typedForms = (forms ?? []) as FormCardRow[];
  const activeFormIds = (activeFormsForCounters ?? []).map((form) => form.id);
  const [{ count: newResponses }, { count: needsHandling }] = activeFormIds.length
    ? await Promise.all([
        supabase
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .in("form_id", activeFormIds)
          .eq("read_status", "new"),
        supabase
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .in("form_id", activeFormIds)
          .in("handling_status", ["unhandled", "partially_handled"]),
      ])
    : [{ count: 0 }, { count: 0 }];
  const formIds = typedForms.map((form) => form.id);
  const { data: submissions } = formIds.length
    ? await supabase
        .from("form_submissions")
        .select("id, form_id, read_status, handling_status, created_at")
        .eq("organization_id", organizationId)
        .in("form_id", formIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [] };
  const statsByFormId = new Map<string, { total: number; newCount: number; needsHandling: number; latest: string | null }>();

  for (const submission of submissions ?? []) {
    const current = statsByFormId.get(submission.form_id) ?? { total: 0, newCount: 0, needsHandling: 0, latest: null };
    statsByFormId.set(submission.form_id, {
      total: current.total + 1,
      newCount: current.newCount + (submission.read_status === "new" ? 1 : 0),
      needsHandling: current.needsHandling + (submission.handling_status === "unhandled" || submission.handling_status === "partially_handled" ? 1 : 0),
      latest: current.latest ?? submission.created_at,
    });
  }

  return (
    <>
      <ModuleHeader
        title="Forms"
        description="Create a form, share the public link, and review responses."
        items={formsNavItems}
        action={{ href: "/dashboard/forms/new", label: "Create form" }}
      />
      <Toast show={params.deleted === "1"} title="Form deleted" message="The public link was disabled. Existing responses were kept." />
      <Toast show={Boolean(params.error)} tone="error" title="Form action failed" message="Please refresh and try again." />
      <Toast show={params.updated === "1"} title="Form updated" message="Your form changes were saved." />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Forms" value={`${activeFormIds.length}`} detail="Active forms and surveys" icon={ClipboardList} />
        <StatCard label="New responses" value={`${newResponses ?? 0}`} detail="Unread responses" icon={Inbox} />
        <StatCard label="Needs handling" value={`${needsHandling ?? 0}`} detail="Open response follow-up" icon={BarChart3} />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Forms</CardTitle>
              <CardDescription>Manage forms, surveys, public links, and responses in one place.</CardDescription>
            </div>
            <ButtonLink href="/dashboard/forms/new" className="shrink-0">
              <Plus className="h-4 w-4" />
              Create form
            </ButtonLink>
          </div>
        </CardHeader>

        <form className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center">
          <select name="status" defaultValue={statusFilter} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            <option value="active">Active forms</option>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">
            Filter
          </button>
        </form>

        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {typedForms.length ? (
            typedForms.map((form) => {
              const stats = statsByFormId.get(form.id) ?? { total: 0, newCount: 0, needsHandling: 0, latest: null };
              const publicUrl = getPublicFormUrl(form.slug);
              const isPublished = form.status === "published" || form.status === "active";

              return (
                <article key={form.id} className="flex min-h-72 flex-col rounded-2xl border bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{form.form_type === "survey" ? "Survey" : "Form"}</Badge>
                        <Badge className={statusBadgeClass(form.status)}>{statusLabel(form.status)}</Badge>
                      </div>
                      <h2 className="mt-3 truncate text-base font-semibold">{form.title}</h2>
                    </div>
                    <FormLifecycleActions formId={form.id} status={form.status} compact />
                  </div>

                  {form.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{form.description}</p> : null}

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Responses" value={stats.total} />
                    <MiniStat label="New" value={stats.newCount} highlight={stats.newCount > 0} />
                    <MiniStat label="Open" value={stats.needsHandling} highlight={stats.needsHandling > 0} />
                  </div>

                  <div className="mt-auto space-y-2 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {form.form_type === "survey" ? (
                        <ButtonLink href={`/dashboard/forms/${form.id}/results`} variant="secondary" className="h-9 flex-1 px-3">
                          Results
                        </ButtonLink>
                      ) : (
                        <ButtonLink href={`/dashboard/forms/${form.id}/responses`} variant="secondary" className="h-9 flex-1 px-3">
                          <Inbox className="h-4 w-4" />
                          Responses
                        </ButtonLink>
                      )}
                      <ButtonLink href={`/dashboard/forms/${form.id}/edit`} variant="secondary" className="h-9 px-3">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </ButtonLink>
                    </div>
                    <ButtonLink href={publicUrl} variant="outline" className="h-9 w-full px-3" target="_blank" aria-disabled={!isPublished}>
                      <ExternalLink className="h-4 w-4" />
                      {isPublished ? "Open public form" : "Public link disabled"}
                    </ButtonLink>
                    <p className="truncate text-xs text-muted-foreground">{stats.latest ? `Latest response ${new Date(stats.latest).toLocaleDateString()}` : "No responses yet"}</p>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center sm:col-span-2 xl:col-span-3">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">No forms yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first form to collect requests, signups, or feedback.
              </p>
              <ButtonLink href="/dashboard/forms/new" className="mt-5">
                <Plus className="h-4 w-4" />
                Create form
              </ButtonLink>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function MiniStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-xl bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" : "rounded-xl bg-white p-3 dark:bg-zinc-950"}>
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function statusLabel(status: FormStatus) {
  return status === "published" || status === "active" ? "Published" : status === "draft" ? "Draft" : "Archived";
}

function statusBadgeClass(status: FormStatus) {
  if (status === "published" || status === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
  if (status === "archived") {
    return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  }
  return "";
}
