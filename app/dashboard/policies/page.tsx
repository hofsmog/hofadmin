/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckCircle2, FileCheck2, PenLine } from "lucide-react";
import { createPolicyAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function PoliciesPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: pendingAcknowledgements }, { count: published }, { data: records }] = await Promise.all([
    db.from("policy_acknowledgements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    db.from("policies").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "published"),
    db.from("policies").select("id, title, description, version, status, require_acknowledgement, require_signature, published_at, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Policies"
      description="Publish policies, manage versions, and track acknowledgements or signatures."
      createTitle="Create policy"
      createDescription="Add a policy record and connect a document path when available."
      listTitle="Policies"
      listDescription="Published policies can be used in onboarding and acknowledgement workflows."
      action={createPolicyAction}
      fields={[
        { name: "title", label: "Policy Title", required: true, placeholder: "IT Policy" },
        { name: "description", label: "Description", type: "textarea", placeholder: "What this policy covers" },
        { name: "version", label: "Version", placeholder: "1.0" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
        { name: "filePath", label: "Document Path", placeholder: "organizations/.../policy.pdf" },
        { name: "requireAcknowledgement", label: "Require acknowledgement", type: "checkbox", description: "Members must confirm they have read this policy." },
        { name: "requireSignature", label: "Require signature", type: "checkbox", description: "Capture a signature for stronger acceptance evidence." },
      ]}
      stats={[
        { label: "Policies Awaiting Acknowledgement", value: pendingAcknowledgements ?? 0, detail: "Pending member confirmations", icon: PenLine },
        { label: "Recently Published Policies", value: published ?? 0, detail: "Currently published", icon: FileCheck2 },
        { label: "Accepted Policies", value: 0, detail: "Acceptance history foundation", icon: CheckCircle2 },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No policies yet"
      emptyDescription="Create your first policy to track acknowledgement and signatures."
      getRecordTitle={(record) => record.title}
      getRecordDescription={(record) => record.description || "No description"}
      getRecordMeta={(record) => `Version ${record.version} - Acknowledgement: ${record.require_acknowledgement ? "Required" : "Optional"} - Signature: ${record.require_signature ? "Required" : "Optional"}`}
      getRecordStatus={(record) => record.status}
    />
  );
}
