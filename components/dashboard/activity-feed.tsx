import { BarChart3, Building2, CalendarCheck, Car, CheckCircle2, ClipboardList, Eye, FileCheck2, FileSignature, FileText, GraduationCap, Handshake, KeyRound, LayoutGrid, Lightbulb, MailPlus, MapPin, Megaphone, Network, PackageCheck, PiggyBank, PlugZap, QrCode, Receipt, ShieldAlert, UserCheck, UserMinus, UserPlus, Vote, Workflow, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityEventType } from "@/types/database";

type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string | null;
  created_at: string;
};

const eventConfig = {
  qr_created: { icon: QrCode, label: "QR" },
  checkin_created: { icon: CheckCircle2, label: "Check-in" },
  member_invited: { icon: MailPlus, label: "Invite" },
  member_created: { icon: MailPlus, label: "Member" },
  form_created: { icon: ClipboardList, label: "Form" },
  form_submission_received: { icon: ClipboardList, label: "Submission" },
  form_submission_read: { icon: Eye, label: "Submission" },
  form_submission_handling_changed: { icon: Workflow, label: "Submission" },
  document_uploaded: { icon: FileText, label: "Document" },
  receipt_uploaded: { icon: Receipt, label: "Receipt" },
  issue_created: { icon: Workflow, label: "Issue" },
  issue_updated: { icon: Workflow, label: "Issue" },
  fault_report_submitted: { icon: ClipboardList, label: "Fault Report" },
  booking_created: { icon: CalendarCheck, label: "Booking" },
  key_issued: { icon: KeyRound, label: "Key" },
  key_returned: { icon: KeyRound, label: "Key" },
  checklist_completed: { icon: CheckCircle2, label: "Checklist" },
  visitor_checked_in: { icon: UserCheck, label: "Visitor" },
  visitor_checked_out: { icon: UserCheck, label: "Visitor" },
  annual_planner_task_completed: { icon: CalendarCheck, label: "Planner" },
  asset_lifecycle_updated: { icon: PackageCheck, label: "Asset" },
  asset_repair_recorded: { icon: Wrench, label: "Repair" },
  asset_retired: { icon: PackageCheck, label: "Asset" },
  onboarding_started: { icon: UserPlus, label: "Onboarding" },
  onboarding_completed: { icon: CheckCircle2, label: "Onboarding" },
  offboarding_started: { icon: UserMinus, label: "Offboarding" },
  offboarding_completed: { icon: CheckCircle2, label: "Offboarding" },
  policy_published: { icon: FileCheck2, label: "Policy" },
  policy_accepted: { icon: FileCheck2, label: "Policy" },
  training_completed: { icon: GraduationCap, label: "Training" },
  certification_expired: { icon: GraduationCap, label: "Training" },
  vote_created: { icon: Vote, label: "Voting" },
  vote_closed: { icon: Vote, label: "Voting" },
  budget_updated: { icon: PiggyBank, label: "Budget" },
  vehicle_service_recorded: { icon: Car, label: "Vehicle" },
  location_created: { icon: MapPin, label: "Location" },
  event_created: { icon: CalendarCheck, label: "Event" },
  event_registration_completed: { icon: UserCheck, label: "Event" },
  announcement_published: { icon: Megaphone, label: "Announcement" },
  project_completed: { icon: Network, label: "Project" },
  contract_renewed: { icon: FileSignature, label: "Contract" },
  article_published: { icon: FileText, label: "Article" },
  purchase_approved: { icon: Receipt, label: "Procurement" },
  department_created: { icon: Building2, label: "Department" },
  timesheet_approved: { icon: CheckCircle2, label: "Time" },
  sponsor_added: { icon: Handshake, label: "Sponsor" },
  idea_submitted: { icon: Lightbulb, label: "Idea" },
  risk_created: { icon: ShieldAlert, label: "Risk" },
  report_generated: { icon: BarChart3, label: "Report" },
  organization_updated: { icon: Building2, label: "Org" },
  module_opened: { icon: LayoutGrid, label: "Module" },
  module_enabled: { icon: PlugZap, label: "Module" },
} satisfies Record<ActivityEventType, { icon: typeof QrCode; label: string }>;

export function ActivityFeed({
  events,
  title = "Recent activity",
  description = "Organization-scoped events from QR, check-ins, team, and settings.",
}: {
  events: ActivityEvent[];
  title?: string;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length ? (
          events.map((event) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;

            return (
              <div
                key={event.id}
                className="flex gap-3 rounded-xl border bg-zinc-50 p-3 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{event.title}</p>
                    <Badge>{config.label}</Badge>
                  </div>
                  {event.description ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="mt-3 font-medium">No activity yet</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Create a QR item, scan a check-in, invite a member, or update settings to populate this feed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
