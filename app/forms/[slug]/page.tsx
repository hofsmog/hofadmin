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
    .eq("status", "published")
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
  const { data: organization } = await supabase
    .from("organizations")
    .select("name, display_name, logo_url, avatar_url, accent_color, background_color, custom_welcome_message, support_email, website_url, public_branding_enabled")
    .eq("id", form.organization_id)
    .maybeSingle();
  const organizationBrandingEnabled = organization?.public_branding_enabled ?? false;
  const organizationLogo = organizationBrandingEnabled ? organization?.logo_url ?? organization?.avatar_url ?? null : null;
  const accentColor = isDefaultColor(form.accent_color, "#2563eb") && organization?.accent_color ? organization.accent_color : form.accent_color;
  const backgroundColor = isDefaultColor(form.background_color, "#f8fafc") && organization?.background_color ? organization.background_color : form.background_color;
  const logoUrl = form.logo_url ?? organizationLogo;
  const welcomeMessage = organizationBrandingEnabled ? organization?.custom_welcome_message ?? null : null;

  const radiusClass = getRadiusClass(form.corner_radius);
  const shellClass = form.form_layout === "full-width" ? "max-w-5xl" : form.form_layout === "minimal" ? "max-w-xl" : "max-w-2xl";

  return (
    <main className={cn("min-h-screen px-4 py-8 sm:px-6", getFontClass(form.font_style))} style={{ backgroundColor, color: form.text_color }}>
      <div className={cn("mx-auto", shellClass)}>
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandLockup size="sm" />
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-12 max-w-40 object-contain" />
          ) : null}
        </div>
        <section className={cn("overflow-hidden border bg-white/92 shadow-sm dark:bg-zinc-950/90", radiusClass, form.form_layout === "minimal" && "border-transparent bg-transparent shadow-none dark:bg-transparent")}>
          {form.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.cover_image_url} alt="" className="h-44 w-full object-cover sm:h-56" />
          ) : null}
          <CardHeader className={cn("border-b bg-transparent", form.form_layout === "minimal" && "border-b-0 px-0")}>
            <div className="mb-2 h-1.5 w-20 rounded-full" style={{ backgroundColor: accentColor }} />
            <CardTitle className="text-2xl" style={{ color: form.text_color }}>{form.title}</CardTitle>
            {form.description ? <CardDescription>{form.description}</CardDescription> : null}
            {form.form_type === "survey" && form.anonymous_responses ? (
              <div className="mt-3 rounded-xl border bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                This survey is anonymous.
              </div>
            ) : null}
            {welcomeMessage ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{welcomeMessage}</p> : null}
          </CardHeader>
          <div className={cn("p-5 sm:p-6", form.form_layout === "minimal" && "px-0")}>
            <PublicForm
              slug={form.slug}
              fields={fields ?? []}
              design={{
                accentColor,
                backgroundColor,
                textColor: form.text_color,
                buttonColor: form.button_color,
                buttonTextColor: form.button_text_color,
                fontStyle: form.font_style,
                formLayout: form.form_layout,
                cornerRadius: form.corner_radius,
                logoUrl,
                coverImageUrl: form.cover_image_url,
                customThankYouMessage: form.custom_thank_you_message,
                submitButtonText: form.submit_button_text,
              }}
            />
          </div>
        </section>
        <footer className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>Powered by HofAdmin</span>
          {organizationBrandingEnabled && organization?.support_email ? <a href={`mailto:${organization.support_email}`}>Need help? {organization.support_email}</a> : null}
          {organizationBrandingEnabled && organization?.website_url ? <a href={organization.website_url}>Visit website</a> : null}
        </footer>
      </div>
    </main>
  );
}

function isDefaultColor(value: string, defaultValue: string) {
  return value.toLowerCase() === defaultValue.toLowerCase();
}
