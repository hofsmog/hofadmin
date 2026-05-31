import { Inbox } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsSubmissionsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: forms }, { data: submissions }] = await Promise.all([
    supabase.from("forms").select("id, title").eq("organization_id", organizationId),
    supabase.from("form_submissions").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
  ]);
  const formsById = new Map((forms ?? []).map((form) => [form.id, form]));

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
        <div className="divide-y px-5 pb-5">
          {(submissions ?? []).length ? submissions?.map((submission) => (
            <div key={submission.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{formsById.get(submission.form_id)?.title ?? "Unknown form"}</p>
                <span className="text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{submission.submitter_email ?? "Internal submission"} · {submission.id.slice(0, 8)}</p>
            </div>
          )) : (
            <div className="py-8 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No submissions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Submissions will appear here after collection is connected.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
