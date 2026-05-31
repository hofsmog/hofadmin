import { notFound } from "next/navigation";
import { PublicForm } from "@/components/forms/public-form";
import { BrandLockup } from "@/components/ui/brand";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!form) {
    notFound();
  }

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("organization_id", form.organization_id)
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <BrandLockup size="sm" />
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white dark:bg-zinc-950">
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description ? <CardDescription>{form.description}</CardDescription> : null}
          </CardHeader>
          <div className="p-5 sm:p-6">
            <PublicForm slug={form.slug} fields={fields ?? []} />
          </div>
        </Card>
      </div>
    </main>
  );
}
