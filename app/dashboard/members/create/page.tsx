import { MemberCreateForm } from "@/components/dashboard/member-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { membersNavItems } from "@/lib/module-nav";
import { getEffectiveMemberLimit, getMemberLimitMessage } from "@/lib/plans";

export default async function MembersCreatePage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const memberLimit = getEffectiveMemberLimit(organizationContext.activeOrganization);
  const { count: totalMembers } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationContext.activeOrganization.id);
  const limitReached = memberLimit !== null && (totalMembers ?? 0) >= memberLimit;

  return (
    <>
      <ModuleHeader title="Add Member" description="Create one member record at a time." items={membersNavItems} />
      <div className="mx-auto max-w-3xl space-y-4">
        <MemberCreateForm disabled={limitReached} limitMessage={getMemberLimitMessage(organizationContext.activeOrganization)} />
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
