import { ClipboardList, ExternalLink, Pencil } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

const publicFormsBaseUrl = "https://hofadmin.vercel.app/forms";

export default async function FormsListPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: forms }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("form_fields").select("*").eq("organization_id", organizationId).order("sort_order", { ascending: true }),
  ]);
  const fieldsByFormId = new Map<string, typeof fields>();
  for (const field of fields ?? []) {
    fieldsByFormId.set(field.form_id, [...(fieldsByFormId.get(field.form_id) ?? []), field]);
  }

  return (
    <>
      <ModuleHeader title="Forms Library" description="Browse active, draft, and archived forms." items={formsNavItems} action={{ href: "/dashboard/forms/create", label: "Create form" }} />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Forms</CardTitle>
              <CardDescription>Form definitions and their field structure.</CardDescription>
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <div className="space-y-3 p-5 pt-0">
          {(forms ?? []).length ? forms?.map((form) => {
            const formFields = fieldsByFormId.get(form.id) ?? [];
            const publicUrl = `${publicFormsBaseUrl}/${form.slug}`;

            return (
              <article key={form.id} className="rounded-xl border bg-zinc-50 p-4 transition hover:bg-white hover:shadow-sm dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{form.title}</h3>
                      <Badge className="capitalize">{form.status}</Badge>
                    </div>
                    {form.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description}</p> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">Created {new Date(form.created_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {formFields.length ? formFields.map((field) => (
                    <Badge key={field.id} className="capitalize">{field.label} - {field.field_type}</Badge>
                  )) : <Badge>No fields</Badge>}
                </div>
                <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-muted-foreground dark:bg-zinc-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />Public share link</div>
                      <code className="mt-2 block overflow-x-auto text-xs">{publicUrl}</code>
                    </div>
                    <div className="flex gap-2">
                      <ButtonLink href={`/dashboard/forms/${form.id}/edit`} variant="secondary" className="h-9 px-3">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </ButtonLink>
                      <ButtonLink href={publicUrl} variant="secondary" className="h-9 px-3" target="_blank">
                        Open
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-medium">No forms yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first form to start collecting structured information.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
