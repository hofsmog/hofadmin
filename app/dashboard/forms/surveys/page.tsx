import { ClipboardList, Plus } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsSurveysPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: surveys, error } = await supabase
    .from("forms")
    .select("id, title, description, status, slug, created_at")
    .eq("organization_id", organizationId)
    .eq("form_type", "survey")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[forms/surveys] Failed to load surveys", { organizationId, error });
  }

  return (
    <>
      <ModuleHeader
        title="Surveys"
        description="Create surveys and review summarized results inside Forms."
        items={formsNavItems}
        action={{ href: "/dashboard/forms/new?type=survey", label: "Create survey" }}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Surveys</CardTitle>
              <CardDescription>Surveys are part of the Forms module.</CardDescription>
            </div>
            <ButtonLink href="/dashboard/forms/new?type=survey" className="shrink-0">
              <Plus className="h-4 w-4" />
              Create survey
            </ButtonLink>
          </div>
        </CardHeader>
        <CardContent className="divide-y">
          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              Surveys could not load right now. Try again or check your connection.
            </div>
          ) : surveys?.length ? (
            surveys.map((survey) => (
              <article key={survey.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-medium">{survey.title}</h2>
                    <Badge className="capitalize">{survey.status}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{survey.description || "No description"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={`/dashboard/forms/${survey.id}/results`} variant="secondary" className="h-9 px-3">
                    Results
                  </ButtonLink>
                  <ButtonLink href={`/dashboard/forms/${survey.id}/edit`} variant="secondary" className="h-9 px-3">
                    Edit
                  </ButtonLink>
                </div>
              </article>
            ))
          ) : (
            <div className="py-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No surveys yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a survey to collect feedback and view results.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
