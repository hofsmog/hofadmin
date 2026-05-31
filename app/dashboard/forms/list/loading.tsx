import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function FormsListLoading() {
  return <PageLoadingSkeleton stats={2} rows={6} />;
}
