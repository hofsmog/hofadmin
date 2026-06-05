import { Activity } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AuditLogsPage() {
  return (
    <>
      <PageHeader
        title="Activity Feed"
        description="Track organization-scoped events, admin changes, and module activity in one place."
      />
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Important organization activity will appear here as your team uses HofAdmin."
      />
    </>
  );
}
