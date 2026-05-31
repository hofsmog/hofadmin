import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function InventoryItemsLoading() {
  return <PageLoadingSkeleton stats={3} rows={8} />;
}
