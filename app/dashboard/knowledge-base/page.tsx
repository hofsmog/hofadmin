/* eslint-disable @typescript-eslint/no-explicit-any */

import { BookOpen, Eye, FileText } from "lucide-react";
import { createKnowledgeArticleAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function KnowledgeBasePage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: published }, { data: records }] = await Promise.all([
    db.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "published"),
    db.from("knowledge_articles").select("id, title, content, status, version, view_count, updated_at, created_at").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(50),
  ]);
  const totalViews = (records ?? []).reduce((sum: number, record: any) => sum + Number(record.view_count ?? 0), 0);
  return <AdvancedRecordsPage title="Knowledge Base" description="Create internal articles, FAQs, guides, categories, and simple version history." createTitle="Create article" createDescription="Write a reusable guide or FAQ for your organization." listTitle="Articles" listDescription="Internal documentation and guides." action={createKnowledgeArticleAction} fields={[{ name: "title", label: "Article Title", required: true }, { name: "content", label: "Content", type: "textarea" }, { name: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] }, { name: "version", label: "Version", placeholder: "1.0" }]} stats={[{ label: "Recently Updated Articles", value: records?.length ?? 0, detail: "Latest 50 articles", icon: FileText }, { label: "Most Viewed Articles", value: totalViews, detail: "Total recorded views", icon: Eye }, { label: "Published Articles", value: published ?? 0, detail: "Visible articles", icon: BookOpen }]} records={records ?? []} params={params} emptyTitle="No articles yet" emptyDescription="Create an article to build your internal knowledge base." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.content || "No content"} getRecordMeta={(record) => `Version ${record.version} - Views: ${record.view_count ?? 0} - Updated: ${new Date(record.updated_at).toLocaleDateString()}`} getRecordStatus={(record) => record.status} />;
}
