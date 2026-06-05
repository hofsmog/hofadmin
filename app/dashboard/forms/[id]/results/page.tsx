import { BarChart3, ClipboardList, MessageSquareText } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";
import type { FormFieldType } from "@/types/database";

type FieldRow = {
  id: string;
  label: string;
  field_type: FormFieldType;
  options: string[] | null;
  sort_order: number;
};

type SubmissionRow = {
  id: string;
  created_at: string;
};

type ValueRow = {
  submission_id: string;
  field_id: string | null;
  field_label: string;
  value: string | null;
};

const choiceFieldTypes = new Set<FormFieldType>(["select", "radio", "checkbox", "scale_1_5", "scale_1_10", "yes_no"]);
const textFieldTypes = new Set<FormFieldType>(["text", "textarea", "email", "phone"]);

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: form } = await supabase
    .from("forms")
    .select("id, title, description, form_type, status, anonymous_responses, slug")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (!form) {
    return (
      <>
        <ModuleHeader title="Survey not found" description="This page is not available in your organization." items={formsNavItems} />
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Check the link or go back to Forms.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (form.form_type !== "survey") {
    return (
      <>
        <ModuleHeader title={form.title} description="This is a regular form with responses." items={formsNavItems} />
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Open responses to handle answers and internal notes.</p>
            <ButtonLink href={`/dashboard/forms/${form.id}/responses`}>Open responses</ButtonLink>
          </CardContent>
        </Card>
      </>
    );
  }

  const [{ data: fields }, { data: submissions }] = await Promise.all([
    supabase
      .from("form_fields")
      .select("id, label, field_type, options, sort_order")
      .eq("organization_id", organizationId)
      .eq("form_id", form.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("form_submissions")
      .select("id, created_at")
      .eq("organization_id", organizationId)
      .eq("form_id", form.id)
      .order("created_at", { ascending: false })
      .limit(250),
  ]);
  const submissionRows = (submissions ?? []) as SubmissionRow[];
  const submissionIds = submissionRows.map((submission) => submission.id);
  const { data: values } = submissionIds.length
    ? await supabase
        .from("form_submission_values")
        .select("submission_id, field_id, field_label, value")
        .eq("organization_id", organizationId)
        .in("submission_id", submissionIds)
    : { data: [] };
  const fieldRows = (fields ?? []) as FieldRow[];
  const valueRows = (values ?? []) as ValueRow[];
  const latestResponses = submissionRows.slice(0, 5);

  return (
    <>
      <ModuleHeader
        title={form.title}
        description="Survey results summarized by question."
        items={formsNavItems}
        action={{ href: `/forms/${form.slug}`, label: "Open public link" }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Responses" value={submissionRows.length.toString()} description="Received survey responses" icon={ClipboardList} />
        <SummaryCard title="Response rate" value="Not available" description="Requires a recipient list in a later version" icon={BarChart3} />
        <SummaryCard title="Privacy" value={form.anonymous_responses ? "Anonymous" : "Not anonymous"} description={form.anonymous_responses ? "Personal details are not linked to the response" : "Responses may include contact fields"} icon={MessageSquareText} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {fieldRows.length ? fieldRows.map((field) => (
            <QuestionSummary key={field.id} field={field} values={valuesForField(field, valueRows)} totalResponses={submissionRows.length} />
          )) : (
            <Card>
              <CardContent className="py-10 text-center">
                <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No questions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add questions in the form builder to summarize responses.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Latest responses</CardTitle>
            <CardDescription>The latest responses for this survey.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {latestResponses.length ? latestResponses.map((submission) => (
              <div key={submission.id} className="py-3 text-sm">
                <span className="font-medium">Response {submission.id.slice(0, 8)}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleString()}</span>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No responses yet.</div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function SummaryCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: typeof ClipboardList }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>
  );
}

function QuestionSummary({ field, values, totalResponses }: { field: FieldRow; values: string[]; totalResponses: number }) {
  const nonEmptyValues = values.map((value) => value.trim()).filter(Boolean);

  if (choiceFieldTypes.has(field.field_type)) {
    const counts = countChoiceValues(field, nonEmptyValues);
    const maxCount = Math.max(...counts.map((count) => count.count), 1);

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{field.label}</CardTitle>
              <CardDescription>{nonEmptyValues.length} of {totalResponses} responses</CardDescription>
            </div>
            <Badge>{fieldTypeLabel(field.field_type)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {counts.length ? counts.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div className="h-2 rounded-full bg-zinc-950 dark:bg-zinc-100" style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%` }} />
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No responses for this question yet.</p>}
        </CardContent>
      </Card>
    );
  }

  if (textFieldTypes.has(field.field_type) || field.field_type === "date" || field.field_type === "number") {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{field.label}</CardTitle>
              <CardDescription>{nonEmptyValues.length} of {totalResponses} responses</CardDescription>
            </div>
            <Badge>{fieldTypeLabel(field.field_type)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {nonEmptyValues.length ? (
            <div className="space-y-2">
              {nonEmptyValues.slice(0, 20).map((value, index) => (
                <div key={`${field.id}-${index}`} className="rounded-xl border bg-zinc-50 p-3 text-sm dark:bg-zinc-900/60">
                  {value}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No text responses yet.</p>}
        </CardContent>
      </Card>
    );
  }

  return null;
}

function valuesForField(field: FieldRow, values: ValueRow[]) {
  return values
    .filter((value) => value.field_id === field.id || value.field_label === field.label)
    .map((value) => value.value ?? "");
}

function countChoiceValues(field: FieldRow, values: string[]) {
  const labels = defaultOptionsFor(field);
  const counts = new Map(labels.map((label) => [label, 0]));

  for (const rawValue of values) {
    const parts = field.field_type === "checkbox" ? rawValue.split(",").map((part) => part.trim()).filter(Boolean) : [rawValue];
    for (const part of parts) {
      counts.set(part, (counts.get(part) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .filter((item) => item.count > 0 || labels.includes(item.label));
}

function defaultOptionsFor(field: FieldRow) {
  if (field.field_type === "scale_1_5") {
    return ["1", "2", "3", "4", "5"];
  }
  if (field.field_type === "scale_1_10") {
    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  }
  if (field.field_type === "yes_no") {
    return ["Yes", "No"];
  }

  return field.options?.length ? field.options : [];
}

function fieldTypeLabel(type: FormFieldType) {
  const labels: Record<FormFieldType, string> = {
    text: "Short text",
    textarea: "Free text",
    email: "Email",
    phone: "Phone",
    number: "Number",
    date: "Date",
    select: "Dropdown",
    checkbox: "Checkboxes",
    radio: "Multiple choice",
    scale_1_5: "Scale 1-5",
    scale_1_10: "Scale 1-10",
    yes_no: "Yes/No",
  };

  return labels[type] ?? type;
}
