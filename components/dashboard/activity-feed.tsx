import { Building2, CheckCircle2, ClipboardList, Eye, LayoutGrid, MailPlus, PlugZap, QrCode, Workflow } from "lucide-react";
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
