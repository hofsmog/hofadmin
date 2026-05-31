import { FormCreateForm } from "@/components/dashboard/form-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formsNavItems } from "@/lib/module-nav";

export default function FormsCreatePage() {
  return (
    <>
      <ModuleHeader title="Create Form" description="Build a structured form with reusable fields." items={formsNavItems} />
      <div className="mx-auto max-w-4xl">
        <FormCreateForm />
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Public sharing placeholder</CardTitle>
            <CardDescription>After creation, each form receives a stable slug that can power a public share URL later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
