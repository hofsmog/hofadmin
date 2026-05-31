import { Inbox } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsSubmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ formId?: string; q?: string }>;
}) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const params = (await searchParams) ?? {};
  const formId = String(params.formId ?? "all");
  const query = String(params.q ?? "").trim();
  const [{ data: forms }, submissionsResult] = await Promise.all([
    supabase.from("forms").select("id, title").eq("organization_id", organizationId),
    buildSubmissionsQuery(supabase, organizationId, formId),
  ]);
  const submissions = submissionsResult.data;
  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const { data: submissionValues } = submissionIds.length
    ? await supabase
        .from("form_submission_values")
        .select("*")
        .eq("organization_id", organizationId)
        .in("submission_id", submissionIds)
    : { data: [] };
  const formsById = new Map((forms ?? []).map((form) => [form.id, form]));
  const valuesBySubmissionId = new Map<string, typeof submissionValues>();

  for (const value of submissionValues ?? []) {
    valuesBySubmissionId.set(value.submission_id, [...(valuesBySubmissionId.get(value.submission_id) ?? []), value]);
  }

  const filteredSubmissions = (submissions ?? []).filter((submission) => {
    if (!query) {
      return true;
    }

    const normalizedQuery = query.toLowerCase();
    const form = formsById.get(submission.form_id);
    const values = valuesBySubmissionId.get(submission.id) ?? [];

    return (
      form?.title.toLowerCase().includes(normalizedQuery) ||
      submission.submitter_email?.toLowerCase().includes(normalizedQuery) ||
      values.some((value) =>
        `${value.field_label} ${value.value ?? ""}`.toLowerCase().includes(normalizedQuery),
      )
    );
  });

  return (
    <>
      <ModuleHeader title="Form Submissions" description="Review captured form responses." items={formsNavItems} />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>Latest responses across organization forms.</CardDescription>
            </div>
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <form className="grid gap-3 p-5 pt-0 md:grid-cols-[1fr_14rem_auto]">
          <Input name="q" defaultValue={query} placeholder="Search submitted values" />
          <select
            name="formId"
            defaultValue={formId}
            className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
          >
            <option value="all">All forms</option>
            {(forms ?? []).map((form) => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">
            Filter
          </button>
        </form>
        <div className="divide-y px-5 pb-5">
          {filteredSubmissions.length ? filteredSubmissions.map((submission) => {
            const values = valuesBySubmissionId.get(submission.id) ?? [];

            return (
              <div key={submission.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{formsById.get(submission.form_id)?.title ?? "Unknown form"}</p>
                  <span className="text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{submission.submitter_email ?? "Internal submission"} · {submission.id.slice(0, 8)}</p>
                {values.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {values.map((value) => (
                      <div key={value.id} className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
                        <p className="text-xs font-medium text-muted-foreground">{value.field_label}</p>
                        <p className="mt-1 break-words text-sm">{value.value || "No value"}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }) : (
            <div className="py-8 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No submissions found</p>
              <p className="mt-1 text-sm text-muted-foreground">Submissions will appear here after public forms are completed.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function buildSubmissionsQuery(
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"],
  organizationId: string,
  formId: string,
) {
  let query = supabase
    .from("form_submissions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (formId !== "all") {
    query = query.eq("form_id", formId);
  }

  return query;
}
