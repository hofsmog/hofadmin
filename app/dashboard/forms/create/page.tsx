import { FormCreateForm } from "@/components/dashboard/form-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { formsNavItems } from "@/lib/module-nav";

export default function FormsCreatePage() {
  return (
    <>
      <ModuleHeader title="Create Form" description="Build a structured form with reusable fields." items={formsNavItems} />
      <div className="mx-auto max-w-6xl">
        <FormCreateForm />
      </div>
    </>
  );
}
