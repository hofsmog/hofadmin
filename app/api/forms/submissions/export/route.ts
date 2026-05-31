import { NextResponse } from "next/server";
import { getRespondentName, groupSubmissionValues } from "@/lib/forms/submissions";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/lib/organizations";
import type { FormSubmissionHandlingStatus, FormSubmissionReadStatus } from "@/types/database";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const context = await getOrganizationContext(supabase, user);
  const organizationId = context.activeOrganization.id;
  const url = new URL(request.url);
  const formId = url.searchParams.get("formId") ?? "all";
  const readStatus = sanitizeReadStatus(url.searchParams.get("readStatus"));
  const handlingStatus = sanitizeHandlingStatus(url.searchParams.get("handlingStatus"));
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  let query = supabase
    .from("form_submissions")
    .select("id, form_id, submitter_email, read_status, handling_status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (formId !== "all") query = query.eq("form_id", formId);
  if (readStatus !== "all") query = query.eq("read_status", readStatus);
  if (handlingStatus !== "all") query = query.eq("handling_status", handlingStatus);
  if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
  if (dateTo) query = query.lte("created_at", new Date(`${dateTo}T23:59:59.999Z`).toISOString());

  const { data: submissions, error } = await query.limit(1000);
  if (error) {
    return new NextResponse(error.message, { status: 400 });
  }

  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const formIds = [...new Set((submissions ?? []).map((submission) => submission.form_id))];
  const [{ data: values }, { data: forms }] = await Promise.all([
    submissionIds.length
      ? supabase.from("form_submission_values").select("submission_id, field_label, value").eq("organization_id", organizationId).in("submission_id", submissionIds)
      : Promise.resolve({ data: [] }),
    formIds.length
      ? supabase.from("forms").select("id, title").eq("organization_id", organizationId).in("id", formIds)
      : Promise.resolve({ data: [] }),
  ]);
  const valuesBySubmission = groupSubmissionValues(values ?? []);
  const formsById = new Map((forms ?? []).map((form) => [form.id, form.title]));
  const fieldLabels = [...new Set((values ?? []).map((value) => value.field_label))];
  const headers = ["submission id", "form title", "respondent name", "submitted_at", "read_status", "handling_status", ...fieldLabels];
  const rows = (submissions ?? []).map((submission) => {
    const submissionValues = valuesBySubmission.get(submission.id) ?? [];
    const valuesByLabel = new Map(submissionValues.map((value) => [value.field_label, value.value ?? ""]));
    return [
      submission.id,
      formsById.get(submission.form_id) ?? "Unknown form",
      getRespondentName(submissionValues),
      submission.created_at,
      submission.read_status,
      submission.handling_status,
      ...fieldLabels.map((label) => valuesByLabel.get(label) ?? ""),
    ];
  });
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hofadmin-form-submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function sanitizeReadStatus(value: string | null): "all" | FormSubmissionReadStatus {
  return value === "new" || value === "read" ? value : "all";
}

function sanitizeHandlingStatus(value: string | null): "all" | FormSubmissionHandlingStatus {
  return value === "unhandled" || value === "partially_handled" || value === "handled" || value === "archived" ? value : "all";
}

function escapeCsv(value: string) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}
