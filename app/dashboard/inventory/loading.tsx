import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function InventoryLoading() {
  return <PageLoadingSkeleton stats={4} rows={5} sidePanel />;
}
