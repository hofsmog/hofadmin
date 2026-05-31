import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function MembersLoading() {
  return <PageLoadingSkeleton stats={3} rows={6} />;
}
