import { notFound } from "next/navigation";
import { FormEditForm } from "@/components/dashboard/form-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formsNavItems } from "@/lib/module-nav";

export default async function FormsEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: form }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("*").eq("id", id).eq("organization_id", organizationId).single(),
    supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", id)
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!form) {
    notFound();
  }

  return (
    <>
      <ModuleHeader
        title="Edit Form"
        description="Adjust fields, order, publishing status, and public design."
        items={formsNavItems}
      />
      <div className="mx-auto max-w-6xl">
        <FormEditForm form={form} fields={fields ?? []} updated={query.updated === "1"} error={Boolean(query.error)} />
      </div>
    </>
  );
}
