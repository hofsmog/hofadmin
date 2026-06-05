import { Bell } from "lucide-react";
import { updateNotificationPreferencesAction } from "@/app/dashboard/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type NotificationPreferences = {
  enable_email_notifications: boolean;
  notify_new_form_response: boolean;
  notify_loan_due_tomorrow: boolean;
  notify_loan_overdue: boolean;
  notify_new_member_added: boolean;
  notification_emails: string[];
} | null;

export function NotificationPreferencesForm({
  preferences,
  disabled,
}: {
  preferences: NotificationPreferences;
  disabled?: boolean;
}) {
  const values = preferences ?? {
    enable_email_notifications: true,
    notify_new_form_response: true,
    notify_loan_due_tomorrow: true,
    notify_loan_overdue: true,
    notify_new_member_added: true,
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
      <CardContent>
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
          </div>

          <button type="submit" disabled={disabled} className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950">
            Save notification settings
          </button>
        </form>
      </CardContent>
    </Card>
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
