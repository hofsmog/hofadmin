import { Settings } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure organization profile, security defaults, module policy, localization, and workspace preferences."
      />
      <EmptyState
        icon={Settings}
        title="Settings foundation"
        description="This starter surface is ready for tenant-scoped preferences, security defaults, and organization governance controls."
      />
    </>
  );
}
