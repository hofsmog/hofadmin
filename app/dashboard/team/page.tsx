import { UsersRound } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default function TeamMembersPage() {
  return (
    <>
      <PageHeader
        title="Team Members"
        description="Invite teammates and prepare role assignments across owner, admin, member, and viewer access."
        actions={<Button type="button">Invite member</Button>}
      />
      <EmptyState
        icon={UsersRound}
        title="Team directory shell"
        description="Member records, invitations, role assignment, and permission enforcement will connect here when backend auth is added."
      />
    </>
  );
}
