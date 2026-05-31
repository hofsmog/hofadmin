import { ArrowLeft, CalendarClock, Inbox, Mail, StickyNote } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { HandlingStatusBadge, ReadStatusBadge } from "@/components/dashboard/submission-status-badge";
import { Toast } from "@/components/ui/toast";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getRespondentName, handlingStatusLabels } from "@/lib/forms/submissions";
import { formsNavItems } from "@/lib/module-nav";
import { updateSubmissionHandlingAction } from "../actions";
import type { FormSubmissionHandlingStatus } from "@/types/database";

const handlingStatuses: FormSubmissionHandlingStatus[] = [
  "unhandled",
  "partially_handled",
  "handled",
  "archived",
];

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams?: Promise<{ updated?: string; error?: string }>;
}) {
  const { submissionId } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, organizationContext, user } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: submission } = await supabase
    .from("form_submissions")
    .select("id, organization_id, form_id, submitter_email, read_status, handling_status, handled_note, handled_at, created_at, forms(id, title, slug)")
    .eq("id", submissionId)
    .eq("organization_id", organizationId)
    .single();

  if (!submission) {
    return (
      <>
        <ModuleHeader title="Submission not found" description="This response is unavailable or outside your organization." items={formsNavItems} />
        <Card>
          <CardContent className="p-8 text-center">
            <Inbox className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-medium">No submission found</p>
            <ButtonLink href="/dashboard/forms/submissions" variant="secondary" className="mt-4">
              Back to submissions
            </ButtonLink>
          </CardContent>
        </Card>
      </>
    );
  }

  if (submission.read_status === "new") {
    const { error: readError } = await supabase
      .from("form_submissions")
      .update({ read_status: "read" })
      .eq("id", submission.id)
      .eq("organization_id", organizationId);

    if (!readError) {
      await recordActivityEvent({
        supabase,
        organizationId,
        actorId: user.id,
        type: "form_submission_read",
        title: "Form submission marked read",
        description: `${submission.forms?.title ?? "A form response"} was opened by staff.`,
        metadata: { submission_id: submission.id, form_id: submission.form_id },
      });

      submission.read_status = "read";
    }
  }

  const [{ data: values }, { data: formFields }] = await Promise.all([
    supabase
      .from("form_submission_values")
      .select("id, field_id, field_label, value, created_at")
      .eq("organization_id", organizationId)
      .eq("submission_id", submission.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("form_fields")
      .select("id, sort_order")
      .eq("organization_id", organizationId)
      .eq("form_id", submission.form_id),
  ]);
  const fieldOrder = new Map((formFields ?? []).map((field) => [field.id, field.sort_order]));
  const orderedValues = [...(values ?? [])].sort((a, b) => {
    const aOrder = a.field_id ? fieldOrder.get(a.field_id) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const bOrder = b.field_id ? fieldOrder.get(b.field_id) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
  const respondentName = getRespondentName(orderedValues);
  const submittedAt = new Date(submission.created_at);

  return (
    <>
      <ModuleHeader
        title="Submission detail"
        description="Review the full response and update handling status."
        items={formsNavItems}
      />
      <Toast show={query.updated === "1"} title="Submission updated" message="Handling status and notes were saved." />
      <Toast show={Boolean(query.error)} tone="error" title="Could not update submission" message="Please check the submission and try again." />

      <div className="mb-4">
        <ButtonLink href="/dashboard/forms/submissions" variant="ghost" className="h-9 px-2">
          <ArrowLeft className="h-4 w-4" />
          Back to submissions
        </ButtonLink>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{respondentName}</CardTitle>
                <CardDescription>{submission.forms?.title ?? "Unknown form"}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReadStatusBadge status={submission.read_status} />
                <HandlingStatusBadge status={submission.handling_status} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {orderedValues.length ? (
              <div className="grid gap-3">
                {orderedValues.map((value) => (
                  <div key={value.id} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{value.field_label}</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value.value || "No value"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No answers saved</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Submission context and timestamps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetaItem icon={CalendarClock} label="Submitted" value={`${submittedAt.toLocaleDateString()} at ${submittedAt.toLocaleTimeString()}`} />
              <MetaItem icon={Mail} label="Email" value={submission.submitter_email ?? "No email captured"} />
              <MetaItem icon={Inbox} label="Submission ID" value={submission.id.slice(0, 8)} />
              {submission.handled_at ? (
                <MetaItem icon={StickyNote} label="Last handled" value={new Date(submission.handled_at).toLocaleString()} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Handling</CardTitle>
              <CardDescription>Track staff follow-up without changing the response.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateSubmissionHandlingAction} className="space-y-4">
                <input type="hidden" name="submissionId" value={submission.id} />
                <div>
                  <label className="text-sm font-medium" htmlFor="handlingStatus">Status</label>
                  <select
                    id="handlingStatus"
                    name="handlingStatus"
                    defaultValue={submission.handling_status}
                    className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  >
                    {handlingStatuses.map((status) => (
                      <option key={status} value={status}>
                        {handlingStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="handledNote">Internal note</label>
                  <textarea
                    id="handledNote"
                    name="handledNote"
                    defaultValue={submission.handled_note ?? ""}
                    rows={5}
                    placeholder="Add context for the next staff member..."
                    className="mt-2 w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  Save handling update
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
