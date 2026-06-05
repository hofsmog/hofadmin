import { Bell } from "lucide-react";
import { updateNotificationPreferencesAction } from "@/app/dashboard/settings/actions";
import { TestEmailButton } from "@/components/dashboard/test-email-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type NotificationPreferences = {
  enable_email_notifications: boolean;
  notify_new_form_response: boolean;
  notify_loan_due_tomorrow: boolean;
  notify_loan_overdue: boolean;
  notify_new_member_added: boolean;
  notify_new_fault_report?: boolean;
  notify_booking_request?: boolean;
  notify_policy_acknowledgement_reminder?: boolean;
  notify_contract_expiration_reminder?: boolean;
  notify_training_expiration_reminder?: boolean;
  notification_emails: string[];
} | null;

export function NotificationPreferencesForm({
  preferences,
  disabled,
  emailStatus,
  emailLogs = [],
}: {
  preferences: NotificationPreferences;
  disabled?: boolean;
  emailStatus: {
    resendApiKeyConfigured: boolean;
    fromAddressConfigured: boolean;
    appUrlConfigured: boolean;
    ready: boolean;
    fromName: string;
    fromAddress: string | null;
    appUrl: string | null;
  };
  emailLogs?: Array<{
    id: string;
    recipient_email: string;
    subject: string;
    event_type: string;
    status: string;
    error_message: string | null;
    created_at: string;
  }>;
}) {
  const values = preferences ?? {
    enable_email_notifications: true,
    notify_new_form_response: true,
    notify_loan_due_tomorrow: true,
    notify_loan_overdue: true,
    notify_new_member_added: true,
    notify_new_fault_report: true,
    notify_booking_request: true,
    notify_policy_acknowledgement_reminder: true,
    notify_contract_expiration_reminder: true,
    notify_training_expiration_reminder: true,
    notification_emails: [],
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Email notification settings for important organization events.</CardDescription>
          </div>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Sender status</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Email is sent server-side through Resend. The sender address must use a verified Resend domain.
              </p>
            </div>
            <Badge className={emailStatus.ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>
              {emailStatus.ready ? "Ready" : "Needs setup"}
            </Badge>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <StatusItem label="RESEND_API_KEY" ready={emailStatus.resendApiKeyConfigured} />
            <StatusItem label="EMAIL_FROM_ADDRESS" ready={emailStatus.fromAddressConfigured} />
            <StatusItem label="APP_URL" ready={emailStatus.appUrlConfigured} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Current sender: {emailStatus.fromAddress ? `${emailStatus.fromName} <${emailStatus.fromAddress}>` : "Not configured"}
          </p>
        </section>

        <form action={updateNotificationPreferencesAction} className="space-y-5">
          <label className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
            <input type="checkbox" name="enableEmailNotifications" defaultChecked={values.enable_email_notifications} disabled={disabled} className="mt-1 h-4 w-4 rounded border-zinc-300" />
            <span>
              <span className="block text-sm font-medium">Enable email notifications</span>
              <span className="mt-1 block text-sm text-muted-foreground">Emails are prepared server-side. Configure RESEND_API_KEY before sending real email.</span>
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Notification emails</span>
            <Input name="notificationEmails" defaultValue={values.notification_emails.join(", ")} disabled={disabled} placeholder="admin@example.com, office@example.com" />
            <span className="text-xs text-muted-foreground">Separate multiple email addresses with commas.</span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle name="notifyNewFormResponse" label="New form response" defaultChecked={values.notify_new_form_response} disabled={disabled} />
            <Toggle name="notifyLoanDueTomorrow" label="Loan due tomorrow" defaultChecked={values.notify_loan_due_tomorrow} disabled={disabled} />
            <Toggle name="notifyLoanOverdue" label="Loan overdue" defaultChecked={values.notify_loan_overdue} disabled={disabled} />
            <Toggle name="notifyNewMemberAdded" label="New member added" defaultChecked={values.notify_new_member_added} disabled={disabled} />
            <Toggle name="notifyNewFaultReport" label="New fault report" defaultChecked={values.notify_new_fault_report !== false} disabled={disabled} />
            <Toggle name="notifyBookingRequest" label="Booking request" defaultChecked={values.notify_booking_request !== false} disabled={disabled} />
            <Toggle name="notifyPolicyAcknowledgementReminder" label="Policy acknowledgement reminder" defaultChecked={values.notify_policy_acknowledgement_reminder !== false} disabled={disabled} />
            <Toggle name="notifyContractExpirationReminder" label="Contract expiration reminder" defaultChecked={values.notify_contract_expiration_reminder !== false} disabled={disabled} />
            <Toggle name="notifyTrainingExpirationReminder" label="Training expiration reminder" defaultChecked={values.notify_training_expiration_reminder !== false} disabled={disabled} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={disabled} className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950">
              Save notification settings
            </button>
            <TestEmailButton disabled={disabled} />
          </div>
        </form>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Latest email logs</p>
              <p className="text-sm text-muted-foreground">Recent delivery attempts for this organization.</p>
            </div>
            <Badge>{emailLogs.length} shown</Badge>
          </div>
          <div className="divide-y rounded-xl border">
            {emailLogs.length ? emailLogs.map((log) => (
              <article key={log.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{log.subject}</p>
                  <Badge className={log.status === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : log.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : ""}>
                    {log.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.recipient_email} - {log.event_type.replaceAll("_", " ")} - {new Date(log.created_at).toLocaleString()}
                </p>
                {log.error_message ? <p className="mt-1 text-xs text-red-600">{log.error_message}</p> : null}
              </article>
            )) : (
              <div className="p-6 text-center">
                <p className="text-sm font-medium">No email logs yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Send a test email or trigger a notification to create the first log.</p>
              </div>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-zinc-950">
      <span className="text-xs font-medium">{label}</span>
      <Badge className={ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>
        {ready ? "Configured" : "Missing"}
      </Badge>
    </div>
  );
}

function Toggle({ name, label, defaultChecked, disabled }: { name: string; label: string; defaultChecked: boolean; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="h-4 w-4 rounded border-zinc-300" />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
