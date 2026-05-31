import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function ScannerLoading() {
  return <PageLoadingSkeleton stats={1} rows={3} />;
}
