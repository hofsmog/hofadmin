import { BarChart3, ClipboardList } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsResultsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: surveys, error } = await supabase
    .from("forms")
    .select("id, title, description, status, created_at")
    .eq("organization_id", organizationId)
    .eq("form_type", "survey")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[forms/results] Failed to load survey results index", { organizationId, error });
  }

  return (
    <>
      <ModuleHeader title="Results" description="Open survey result summaries from the Forms module." items={formsNavItems} />

      <Card>
        <CardHeader>
          <CardTitle>Survey results</CardTitle>
          <CardDescription>Choose a survey to view summarized answers.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              Results could not load right now. Try again or check your connection.
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
                <ButtonLink href={`/dashboard/forms/${survey.id}/results`} className="shrink-0">
                  <BarChart3 className="h-4 w-4" />
                  Open results
                </ButtonLink>
              </article>
            ))
          ) : (
            <div className="py-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No survey results yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Results will appear here after a survey receives responses.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
