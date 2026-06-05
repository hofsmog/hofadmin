import Link from "next/link";
import { AlertCircle, Clock3, Download, Inbox, Search } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { HandlingStatusBadge, ReadStatusBadge } from "@/components/dashboard/submission-status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicFormUrl } from "@/lib/app-url";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getResponseTitle, groupSubmissionValues, handlingStatusLabels } from "@/lib/forms/submissions";
import { formsNavItems } from "@/lib/module-nav";
import { cn } from "@/lib/utils";
import type { FormSubmissionHandlingStatus, FormSubmissionReadStatus } from "@/types/database";
import { updateSubmissionStatusAction } from "../../submissions/actions";

const readStatusOptions: Array<"all" | FormSubmissionReadStatus> = ["all", "new", "read"];
const handlingStatusOptions: Array<"all" | FormSubmissionHandlingStatus> = [
  "all",
  "unhandled",
  "partially_handled",
  "handled",
  "archived",
];

export default async function FormResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ q?: string; readStatus?: string; handlingStatus?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const search = String(query.q ?? "").trim();
  const readStatus = sanitizeReadStatus(query.readStatus);
  const handlingStatus = sanitizeHandlingStatus(query.handlingStatus);
  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("id, title, description, status, slug, form_type")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (formError || !form) {
    return (
      <>
        <ModuleHeader title="Form not found" description="This form is unavailable or outside your organization." items={formsNavItems} />
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Form not found</p>
            <ButtonLink href="/dashboard/forms" variant="secondary" className="mt-4">
              Back to forms
            </ButtonLink>
          </CardContent>
        </Card>
      </>
    );
  }

  let submissionsQuery = supabase
    .from("form_submissions")
    .select("id, form_id, submitter_email, read_status, handling_status, created_at")
    .eq("organization_id", organizationId)
    .eq("form_id", form.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (readStatus !== "all") {
    submissionsQuery = submissionsQuery.eq("read_status", readStatus);
  }

  if (handlingStatus !== "all") {
    submissionsQuery = submissionsQuery.eq("handling_status", handlingStatus);
  }

  const [
    { data: submissions, error: submissionsError },
    { count: totalResponses },
    { count: newResponses },
    { count: needsHandling },
  ] = await Promise.all([
    submissionsQuery,
    supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("form_id", form.id),
    supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("form_id", form.id).eq("read_status", "new"),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("form_id", form.id)
      .in("handling_status", ["unhandled", "partially_handled"]),
  ]);
  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const { data: values, error: valuesError } = submissionIds.length
    ? await supabase
        .from("form_submission_values")
        .select("id, submission_id, field_label, value")
        .eq("organization_id", organizationId)
        .in("submission_id", submissionIds)
    : { data: [] };
  const valuesBySubmissionId = groupSubmissionValues(values ?? []);
  const filteredSubmissions = (submissions ?? []).filter((submission) => {
    if (!search) {
      return true;
    }

    const normalized = search.toLowerCase();
    const submissionValues = valuesBySubmissionId.get(submission.id) ?? [];
    const responseTitle = getResponseTitle(submissionValues, submission.id).toLowerCase();

    return (
      responseTitle.includes(normalized) ||
      submission.submitter_email?.toLowerCase().includes(normalized) ||
      submissionValues.some((value) => `${value.field_label} ${value.value ?? ""}`.toLowerCase().includes(normalized))
    );
  });
  const publicUrl = getPublicFormUrl(form.slug);

  return (
    <>
      <ModuleHeader
        title={`${form.title} responses`}
        description="Review responses, update status, add notes, and export this form."
        items={formsNavItems}
        action={{ href: publicUrl, label: "Open public form" }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Responses" value={`${totalResponses ?? 0}`} detail="Total received" icon={Inbox} />
        <StatCard label="New responses" value={`${newResponses ?? 0}`} detail="Unread responses" icon={Clock3} />
        <StatCard label="Needs handling" value={`${needsHandling ?? 0}`} detail="Open follow-up" icon={AlertCircle} />
      </div>

      <Card className="mt-5 overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Responses</CardTitle>
              <CardDescription>Open a response to see all answers and internal notes.</CardDescription>
            </div>
            <ButtonLink
              href={`/api/forms/submissions/export?${new URLSearchParams({ formId: form.id, readStatus, handlingStatus }).toString()}`}
              variant="secondary"
              className="shrink-0"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </ButtonLink>
          </div>
        </CardHeader>

        {submissionsError || valuesError ? (
          <div className="border-t bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            {submissionsError?.message ?? valuesError?.message ?? "Responses could not fully load."}
          </div>
        ) : null}

        <form className="grid gap-3 border-t p-5 md:grid-cols-[1fr_11rem_14rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={search} placeholder="Search responses" className="pl-9" />
          </div>
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
                {status === "all" ? "All statuses" : handlingStatusLabels[status]}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">
            Filter
          </button>
        </form>

        <div className="divide-y border-t">
          {filteredSubmissions.length ? (
            filteredSubmissions.map((submission) => {
              const submissionValues = valuesBySubmissionId.get(submission.id) ?? [];
              const responseTitle = getResponseTitle(submissionValues, submission.id);
              const submittedAt = new Date(submission.created_at);
              const isNew = submission.read_status === "new";

              return (
                <article
                  key={submission.id}
                  className={cn(
                    "grid gap-3 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60 lg:grid-cols-[minmax(0,1fr)_12rem_20rem]",
                    isNew && "bg-emerald-50/70 dark:bg-emerald-950/20",
                  )}
                >
                  <Link href={`/dashboard/forms/submissions/${submission.id}`} className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isNew ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
                      <p className={cn("truncate text-sm", isNew ? "font-semibold text-zinc-950 dark:text-zinc-50" : "font-medium")}>{responseTitle}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{submission.submitter_email ?? "No email captured"}</p>
                  </Link>
                  <Link href={`/dashboard/forms/submissions/${submission.id}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>{submittedAt.toLocaleDateString()} {submittedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <ReadStatusBadge status={submission.read_status} />
                    <HandlingStatusBadge status={submission.handling_status} />
                    <form action={updateSubmissionStatusAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <input type="hidden" name="returnTo" value={`/dashboard/forms/${form.id}/responses`} />
                      <select name="readStatus" defaultValue={submission.read_status} className="h-8 rounded-lg border bg-white px-2 text-xs dark:bg-zinc-950">
                        <option value="new">New</option>
                        <option value="read">Read</option>
                      </select>
                      <select name="handlingStatus" defaultValue={submission.handling_status} className="h-8 rounded-lg border bg-white px-2 text-xs dark:bg-zinc-950">
                        <option value="unhandled">Unhandled</option>
                        <option value="partially_handled">Partially handled</option>
                        <option value="handled">Handled</option>
                      </select>
                      <button type="submit" className="h-8 rounded-lg border bg-white px-2 text-xs font-medium shadow-sm dark:bg-zinc-950">
                        Save
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="px-5 py-10 text-center">
              <Inbox className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No responses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Share your form link to start collecting responses.</p>
              <ButtonLink href={publicUrl} variant="secondary" className="mt-4" target="_blank">
                Open public form
              </ButtonLink>
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
