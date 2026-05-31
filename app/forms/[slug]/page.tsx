import { notFound } from "next/navigation";
import { PublicForm } from "@/components/forms/public-form";
import { BrandLockup } from "@/components/ui/brand";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFontClass, getRadiusClass } from "@/lib/forms/design";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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

  const radiusClass = getRadiusClass(form.corner_radius);
  const shellClass = form.form_layout === "full-width" ? "max-w-5xl" : form.form_layout === "minimal" ? "max-w-xl" : "max-w-2xl";

  return (
    <main className={cn("min-h-screen px-4 py-8 sm:px-6", getFontClass(form.font_style))} style={{ backgroundColor: form.background_color, color: form.text_color }}>
      <div className={cn("mx-auto", shellClass)}>
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandLockup size="sm" />
          {form.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo_url} alt="" className="h-12 max-w-40 object-contain" />
          ) : null}
        </div>
        <section className={cn("overflow-hidden border bg-white/92 shadow-sm dark:bg-zinc-950/90", radiusClass, form.form_layout === "minimal" && "border-transparent bg-transparent shadow-none dark:bg-transparent")}>
          {form.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.cover_image_url} alt="" className="h-44 w-full object-cover sm:h-56" />
          ) : null}
          <CardHeader className={cn("border-b bg-transparent", form.form_layout === "minimal" && "border-b-0 px-0")}>
            <div className="mb-2 h-1.5 w-20 rounded-full" style={{ backgroundColor: form.accent_color }} />
            <CardTitle className="text-2xl" style={{ color: form.text_color }}>{form.title}</CardTitle>
            {form.description ? <CardDescription>{form.description}</CardDescription> : null}
          </CardHeader>
          <div className={cn("p-5 sm:p-6", form.form_layout === "minimal" && "px-0")}>
            <PublicForm
              slug={form.slug}
              fields={fields ?? []}
              design={{
                accentColor: form.accent_color,
                backgroundColor: form.background_color,
                textColor: form.text_color,
                buttonColor: form.button_color,
                buttonTextColor: form.button_text_color,
                fontStyle: form.font_style,
                formLayout: form.form_layout,
                cornerRadius: form.corner_radius,
                logoUrl: form.logo_url,
                coverImageUrl: form.cover_image_url,
                customThankYouMessage: form.custom_thank_you_message,
                submitButtonText: form.submit_button_text,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
