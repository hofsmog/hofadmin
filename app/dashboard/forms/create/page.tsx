import { FormCreateForm } from "@/components/dashboard/form-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formsNavItems } from "@/lib/module-nav";
import type { FormType } from "@/types/database";

export default async function FormsCreatePage({ searchParams }: { searchParams?: Promise<{ type?: string }> }) {
  const params = (await searchParams) ?? {};
  const formType: FormType | null = params.type === "survey" ? "survey" : params.type === "form" ? "form" : null;

  if (!formType) {
    return (
      <>
        <ModuleHeader title="Skapa ny" description="Välj om du vill samla in ärenden eller sammanställa en undersökning." items={formsNavItems} />
        <div className="grid gap-4 md:grid-cols-2">
          <CreateChoice title="Formulär" description="Kontakt, anmälan, felanmälan eller ansökan." href="/dashboard/forms/create?type=form" />
          <CreateChoice title="Undersökning" description="Enkät, trivselmätning, utvärdering eller feedback." href="/dashboard/forms/create?type=survey" />
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader title={formType === "survey" ? "Skapa undersökning" : "Skapa formulär"} description={formType === "survey" ? "Bygg en enkät med frågor som kan sammanställas." : "Bygg ett formulär med tydligt inkorgsflöde."} items={formsNavItems} />
      <div className="mx-auto max-w-6xl">
        <FormCreateForm formType={formType} />
      </div>
    </>
  );
}

function CreateChoice({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <ButtonLink href={href} className="mt-4 w-fit">
          Skapa {title.toLowerCase()}
        </ButtonLink>
      </CardHeader>
    </Card>
  );
}
