import { MemberCreateForm } from "@/components/dashboard/member-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { membersNavItems } from "@/lib/module-nav";

export default function MembersCreatePage() {
  return (
    <>
      <ModuleHeader title="Add Member" description="Create one member record at a time." items={membersNavItems} />
      <div className="mx-auto max-w-3xl space-y-4">
        <MemberCreateForm />
        <Card>
          <CardHeader>
            <CardTitle>QR linking placeholder</CardTitle>
            <CardDescription>Member records are ready for future QR cards and check-in linkage without crowding this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
