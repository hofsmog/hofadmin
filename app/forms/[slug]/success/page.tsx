import { CheckCircle2 } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFontClass, getRadiusClass } from "@/lib/forms/design";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function PublicFormSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: form } = supabase
    ? await supabase
        .from("forms")
        .select("organization_id, title, background_color, text_color, accent_color, font_style, corner_radius, logo_url, custom_thank_you_message")
        .eq("slug", slug)
        .single()
    : { data: null };
  const { data: organization } = supabase && form
    ? await supabase
        .from("organizations")
        .select("logo_url, avatar_url, accent_color, background_color, support_email, website_url, public_branding_enabled")
        .eq("id", form.organization_id)
        .maybeSingle()
    : { data: null };
  const organizationBrandingEnabled = organization?.public_branding_enabled ?? false;
  const message = form?.custom_thank_you_message || "Thank you. Your response has been submitted.";
  const backgroundColor = form?.background_color === "#f8fafc" && organization?.background_color ? organization.background_color : form?.background_color ?? "#f8fafc";
  const textColor = form?.text_color ?? "#111827";
  const accentColor = form?.accent_color === "#2563eb" && organization?.accent_color ? organization.accent_color : form?.accent_color ?? "#059669";
  const logoUrl = form?.logo_url ?? (organizationBrandingEnabled ? organization?.logo_url ?? organization?.avatar_url : null);
  const radiusClass = getRadiusClass(form?.corner_radius ?? "medium");

  return (
    <main className={cn("grid min-h-screen place-items-center px-4 py-8", getFontClass(form?.font_style ?? "default"))} style={{ backgroundColor, color: textColor }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandLockup size="sm" />
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-12 max-w-40 object-contain" />
          ) : null}
        </div>
        <Card className={cn("text-center", radiusClass)}>
          <CardHeader>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ backgroundColor: accentColor }}>
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle style={{ color: textColor }}>{message}</CardTitle>
            <CardDescription>Your answers were saved successfully.</CardDescription>
          </CardHeader>
        </Card>
        <footer className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <span>Powered by HofAdmin</span>
          {organizationBrandingEnabled && organization?.support_email ? <a href={`mailto:${organization.support_email}`}>Need help? {organization.support_email}</a> : null}
          {organizationBrandingEnabled && organization?.website_url ? <a href={organization.website_url}>Visit website</a> : null}
        </footer>
      </div>
    </main>
  );
}
