/* eslint-disable @typescript-eslint/no-explicit-any */

import { Lightbulb, ThumbsUp, Workflow } from "lucide-react";
import { createIdeaAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function IdeasPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: newIdeas }, { count: votes }, { data: records }] = await Promise.all([
    db.from("ideas").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "new"),
    db.from("idea_votes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("ideas").select("id, title, description, category, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  return <AdvancedRecordsPage title="Ideas" description="Collect ideas and suggestions with categories, voting, comments, and status tracking." createTitle="Submit idea" createDescription="Capture a useful suggestion in a simple format." listTitle="Ideas and suggestions" listDescription="Review new ideas and status." action={createIdeaAction} fields={[{ name: "title", label: "Idea Title", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "category", label: "Category" }, { name: "status", label: "Status", type: "select", options: ["new", "under_review", "approved", "rejected", "implemented"] }]} stats={[{ label: "New Ideas", value: newIdeas ?? 0, detail: "Waiting for review", icon: Lightbulb }, { label: "Most Voted Ideas", value: votes ?? 0, detail: "Total idea votes", icon: ThumbsUp }, { label: "Under Review", value: records?.filter((record: any) => record.status === "under_review").length ?? 0, detail: "Currently being reviewed", icon: Workflow }]} records={records ?? []} params={params} emptyTitle="No ideas yet" emptyDescription="Submit the first idea to start collecting suggestions." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.description || record.category || "No description"} getRecordMeta={(record) => `Category: ${record.category || "Not set"} - Submitted: ${new Date(record.created_at).toLocaleDateString()}`} getRecordStatus={(record) => record.status} />;
}
