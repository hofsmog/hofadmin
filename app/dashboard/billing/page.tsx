import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Prepare subscription plan, invoices, module entitlements, usage, and billing contacts per organization."
      />
      <EmptyState
        icon={CreditCard}
        title="Billing shell"
        description="No billing backend is mocked yet. This route is ready for Vercel and payment provider integration when selected."
      />
    </>
  );
}
