import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function InventoryActivityLoading() {
  return <PageLoadingSkeleton stats={2} rows={8} />;
}
