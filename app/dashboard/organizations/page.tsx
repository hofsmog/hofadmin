import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default function OrganizationsPage() {
  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage tenant records, workspace metadata, plans, and cross-organization context."
        actions={<Button type="button">New organization</Button>}
      />
      <EmptyState
        icon={Building2}
        title="Organization management shell"
        description="This page is ready for Supabase-backed tenant creation, membership joins, and organization-level policy checks."
      />
    </>
  );
}
