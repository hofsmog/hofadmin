import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function SubmissionsLoading() {
  return <PageLoadingSkeleton stats={3} rows={7} />;
}
