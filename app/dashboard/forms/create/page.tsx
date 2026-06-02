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
        <ModuleHeader title="Create new" description="Choose whether you want an inbox workflow or a summarized survey." items={formsNavItems} />
        <div className="grid gap-4 md:grid-cols-2">
          <CreateChoice title="Form" description="Contact, registration, incident report, or application." href="/dashboard/forms/create?type=form" />
          <CreateChoice title="Survey" description="Questionnaire, satisfaction check, evaluation, or feedback." href="/dashboard/forms/create?type=survey" />
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader title={formType === "survey" ? "Create survey" : "Create form"} description={formType === "survey" ? "Build a survey with questions that can be summarized." : "Build a form with a clear inbox workflow."} items={formsNavItems} />
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
          Create {title.toLowerCase()}
        </ButtonLink>
      </CardHeader>
    </Card>
  );
}
