import Link from "next/link";
import { AlertCircle, Clock3, Download, Inbox, Search } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { HandlingStatusBadge, ReadStatusBadge } from "@/components/dashboard/submission-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getResponseTitle, groupSubmissionValues, handlingStatusLabels } from "@/lib/forms/submissions";
import { formsNavItems } from "@/lib/module-nav";
import { cn } from "@/lib/utils";
import type { FormSubmissionHandlingStatus, FormSubmissionReadStatus } from "@/types/database";
import { updateSubmissionStatusAction } from "./actions";

const readStatusOptions: Array<"all" | FormSubmissionReadStatus> = ["all", "new", "read"];
const handlingStatusOptions: Array<"all" | FormSubmissionHandlingStatus> = [
  "all",
  "unhandled",
  "partially_handled",
  "handled",
  "archived",
];

export default async function FormsSubmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    formId?: string;
    q?: string;
    readStatus?: string;
    handlingStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const params = (await searchParams) ?? {};
  const formId = String(params.formId ?? "all");
  const query = String(params.q ?? "").trim();
  const readStatus = sanitizeReadStatus(params.readStatus);
  const handlingStatus = sanitizeHandlingStatus(params.handlingStatus);
  const dateFrom = String(params.dateFrom ?? "");
  const dateTo = String(params.dateTo ?? "");
  const { data: forms, error: formsError } = await supabase
    .from("forms")
    .select("id, title")
    .eq("organization_id", organizationId)
    .eq("form_type", "form")
    .neq("status", "archived")
    .order("title", { ascending: true });
  const formIds = (forms ?? []).map((form) => form.id);
  const submissionsResult = formIds.length
    ? await buildSubmissionsQuery(supabase, organizationId, { formId, formIds, readStatus, handlingStatus, dateFrom, dateTo })
    : { data: [] };
  const submissionsError = "error" in submissionsResult ? submissionsResult.error : null;
  const submissions = submissionsResult.data ?? [];
  const submissionIds = submissions.map((submission) => submission.id);
  const { data: submissionValues, error: valuesError } = submissionIds.length
    ? await supabase
        .from("form_submission_values")
        .select("id, submission_id, field_label, value")
        .eq("organization_id", organizationId)
        .in("submission_id", submissionIds)
    : { data: [] };
  const formsById = new Map((forms ?? []).map((form) => [form.id, form]));
  const valuesBySubmissionId = groupSubmissionValues(submissionValues ?? []);
  const filteredSubmissions = submissions.filter((submission) => {
    if (!query) {
      return true;
    }

    const normalizedQuery = query.toLowerCase();
    const values = valuesBySubmissionId.get(submission.id) ?? [];
    const respondentName = getResponseTitle(values, submission.id).toLowerCase();

    return (
      respondentName.includes(normalizedQuery) ||
      formsById.get(submission.form_id)?.title.toLowerCase().includes(normalizedQuery) ||
      submission.submitter_email?.toLowerCase().includes(normalizedQuery) ||
      values.some((value) => `${value.field_label} ${value.value ?? ""}`.toLowerCase().includes(normalizedQuery))
    );
  });

  return (
    <>
      <ModuleHeader title="Form Submissions" description="Triage new responses, assign handling status, and open details only when needed." items={formsNavItems} />
      {formsError || submissionsError || valuesError ? (
        <Card className="mb-4 border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Submissions could not fully load.</p>
              <p className="mt-1 text-sm opacity-80">
                {formsError?.message ?? submissionsError?.message ?? valuesError?.message ?? "Please refresh the page or check the database policies for this organization."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Submission inbox</CardTitle>
              <CardDescription>Compact list view for high-volume response workflows.</CardDescription>
            </div>
            <div className="rounded-full border bg-zinc-50 px-3 py-1 text-xs font-medium text-muted-foreground dark:bg-zinc-900">
              {filteredSubmissions.length} shown
            </div>
          </div>
        </CardHeader>

        <form className="grid gap-3 border-t p-5 md:grid-cols-[1fr_13rem_10rem_13rem_10rem_10rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="Search name, email, form, values" className="pl-9" />
          </div>
          <select name="formId" defaultValue={formId} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            <option value="all">All forms</option>
            {(forms ?? []).map((form) => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
          <select name="readStatus" defaultValue={readStatus} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            {readStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All read" : status === "new" ? "New" : "Read"}
              </option>
            ))}
          </select>
          <select name="handlingStatus" defaultValue={handlingStatus} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            {handlingStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All handling" : handlingStatusLabels[status]}
              </option>
            ))}
          </select>
          <Input name="dateFrom" type="date" defaultValue={dateFrom} />
          <Input name="dateTo" type="date" defaultValue={dateTo} />
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">
            Filter
          </button>
        </form>
        <div className="flex justify-end border-t px-5 py-3">
          <Link
            href={`/api/forms/submissions/export?${new URLSearchParams({ formId, readStatus, handlingStatus, dateFrom, dateTo }).toString()}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
        </div>

        <div className="divide-y border-t">
          {filteredSubmissions.length ? (
            filteredSubmissions.map((submission) => {
              const values = valuesBySubmissionId.get(submission.id) ?? [];
              const respondentName = getResponseTitle(values, submission.id);
              const submittedAt = new Date(submission.created_at);
              const isNew = submission.read_status === "new";

              return (
                <article
                  key={submission.id}
                  className={cn(
                    "grid gap-3 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_11rem_20rem]",
                    isNew && "bg-emerald-50/70 dark:bg-emerald-950/20",
                  )}
                >
                  <Link href={`/dashboard/forms/submissions/${submission.id}`} className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isNew ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
                      <p className={cn("truncate text-sm", isNew ? "font-semibold text-zinc-950 dark:text-zinc-50" : "font-medium")}>{respondentName}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{submission.submitter_email ?? "No email captured"}</p>
                  </Link>
                  <Link href={`/dashboard/forms/submissions/${submission.id}`} className="min-w-0">
                    <p className={cn("truncate text-sm", isNew ? "font-semibold" : "font-medium")}>{formsById.get(submission.form_id)?.title ?? "Unknown form"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{submission.id.slice(0, 8)}</p>
                  </Link>
                  <Link href={`/dashboard/forms/submissions/${submission.id}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>{submittedAt.toLocaleDateString()} {submittedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end" onClick={(event) => event.stopPropagation()}>
                    <ReadStatusBadge status={submission.read_status} />
                    <HandlingStatusBadge status={submission.handling_status} />
                    <form action={updateSubmissionStatusAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <input type="hidden" name="returnTo" value="/dashboard/forms/submissions" />
                      <select name="readStatus" defaultValue={submission.read_status} className="h-8 rounded-lg border bg-white px-2 text-xs dark:bg-zinc-950">
                        <option value="new">New</option>
                        <option value="read">Read</option>
                      </select>
                      <select name="handlingStatus" defaultValue={submission.handling_status} className="h-8 rounded-lg border bg-white px-2 text-xs dark:bg-zinc-950">
                        <option value="unhandled">Unhandled</option>
                        <option value="partially_handled">Partially handled</option>
                        <option value="handled">Handled</option>
                      </select>
                      <button type="submit" className="h-8 rounded-lg border bg-white px-2 text-xs font-medium shadow-sm dark:bg-zinc-950">Save</button>
                    </form>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="px-5 py-10 text-center">
              <Inbox className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No submissions found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different filter, or wait for public form responses to arrive.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function sanitizeReadStatus(status: string | undefined): "all" | FormSubmissionReadStatus {
  return status === "new" || status === "read" ? status : "all";
}

function sanitizeHandlingStatus(status: string | undefined): "all" | FormSubmissionHandlingStatus {
  return status === "unhandled" || status === "partially_handled" || status === "handled" || status === "archived"
    ? status
    : "all";
}

function buildSubmissionsQuery(
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"],
  organizationId: string,
  filters: {
    formId: string;
    formIds: string[];
    readStatus: "all" | FormSubmissionReadStatus;
    handlingStatus: "all" | FormSubmissionHandlingStatus;
    dateFrom: string;
    dateTo: string;
  },
) {
  let query = supabase
    .from("form_submissions")
    .select("id, organization_id, form_id, submitted_by, submitter_email, read_status, handling_status, handled_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (filters.formId !== "all" && filters.formIds.includes(filters.formId)) {
    query = query.eq("form_id", filters.formId);
  } else {
    query = query.in("form_id", filters.formIds);
  }

  if (filters.readStatus !== "all") {
    query = query.eq("read_status", filters.readStatus);
  }

  if (filters.handlingStatus !== "all") {
    query = query.eq("handling_status", filters.handlingStatus);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", new Date(filters.dateFrom).toISOString());
  }

  if (filters.dateTo) {
    query = query.lte("created_at", new Date(`${filters.dateTo}T23:59:59.999Z`).toISOString());
  }

  return query;
}
