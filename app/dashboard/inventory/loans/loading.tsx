import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function InventoryLoansLoading() {
  return <PageLoadingSkeleton stats={2} rows={8} />;
}
