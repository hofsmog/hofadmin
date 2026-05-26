import { Activity } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AuditLogsPage() {
  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Track organization-scoped events for security, compliance, admin changes, and module lifecycle activity."
      />
      <EmptyState
        icon={Activity}
        title="Audit event shell"
        description="This page is structured for immutable event records once Supabase tables and policies are introduced."
      />
    </>
  );
}
