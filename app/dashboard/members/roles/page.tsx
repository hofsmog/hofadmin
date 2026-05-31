import { ShieldCheck } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { membersNavItems } from "@/lib/module-nav";

const roles = [
  { name: "Owner", detail: "Full organization control, billing readiness, settings, members, and modules." },
  { name: "Admin", detail: "Can manage organization operations, invite team members, and update module data." },
  { name: "Member", detail: "Can access organization-scoped module data according to RLS policies." },
];

export default function MembersRolesPage() {
  return (
    <>
      <ModuleHeader title="Roles" description="Understand current roles and future permission controls." items={membersNavItems} />
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle>{role.name}</CardTitle>
              <CardDescription>{role.detail}</CardDescription>
              <div className="pt-2"><Badge>Current role model</Badge></div>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Permission controls placeholder</CardTitle>
          <CardDescription>Granular module permissions can build on the existing organization roles and RLS policies.</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
