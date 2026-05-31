import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function InventoryScanLoading() {
  return <PageLoadingSkeleton stats={1} rows={3} />;
}
