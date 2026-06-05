/* eslint-disable @typescript-eslint/no-explicit-any */

import { BarChart3, CalendarClock, Vote } from "lucide-react";
import { createVoteAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function VotingPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const now = new Date().toISOString();
  const [{ count: activeVotes }, { count: upcomingElections }, { count: totalVotes }, { data: records }] = await Promise.all([
    db.from("votes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "open"),
    db.from("votes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("vote_type", "election").gte("starts_at", now),
    db.from("vote_ballots").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("votes").select("id, title, description, vote_type, status, anonymous, starts_at, ends_at, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Voting"
      description="Create votes and elections with voting periods, anonymous voting, and simple results."
      createTitle="Create vote or election"
      createDescription="Start with a question, options, and voting period."
      listTitle="Votes and elections"
      listDescription="Review status, dates, and participation foundation."
      action={createVoteAction}
      fields={[
        { name: "title", label: "Title", required: true, placeholder: "Board election 2026" },
        { name: "description", label: "Description", type: "textarea", placeholder: "What members are voting on" },
        { name: "voteType", label: "Type", type: "select", options: ["vote", "election"] },
        { name: "status", label: "Status", type: "select", options: ["draft", "open", "closed"] },
        { name: "startsAt", label: "Starts At", type: "datetime-local" },
        { name: "endsAt", label: "Ends At", type: "datetime-local" },
        { name: "anonymous", label: "Anonymous voting", type: "checkbox", description: "Hide voter identity in result review where possible." },
        { name: "options", label: "Options or Candidates", type: "textarea", placeholder: "Option A\nOption B\nOption C" },
      ]}
      stats={[
        { label: "Active Votes", value: activeVotes ?? 0, detail: "Currently open", icon: Vote },
        { label: "Upcoming Elections", value: upcomingElections ?? 0, detail: "Scheduled election records", icon: CalendarClock },
        { label: "Total Votes", value: totalVotes ?? 0, detail: "Ballots recorded", icon: BarChart3 },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No votes yet"
      emptyDescription="Create a vote or election to start collecting member decisions."
      getRecordTitle={(record) => record.title}
      getRecordDescription={(record) => record.description || `${record.vote_type === "election" ? "Election" : "Vote"} record`}
      getRecordMeta={(record) => `Starts: ${record.starts_at ? new Date(record.starts_at).toLocaleString() : "Not set"} - Ends: ${record.ends_at ? new Date(record.ends_at).toLocaleString() : "Not set"} - Anonymous: ${record.anonymous ? "Yes" : "No"}`}
      getRecordStatus={(record) => record.status}
    />
  );
}
