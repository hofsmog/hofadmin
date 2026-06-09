import { notFound } from "next/navigation";
import { CheckCircle2, MailOpen } from "lucide-react";
import { markInternalMessageReadAction } from "@/app/dashboard/messages/actions";
import { MessagesTabs } from "@/app/dashboard/messages/page";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { InternalMessage } from "@/lib/messages";

export default async function MessageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ messageId: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { messageId } = await params;
  const query = (await searchParams) ?? {};
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const { data, error } = await supabase
    .from("internal_messages")
    .select("id, organization_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject, body, read_at, created_at")
    .eq("id", messageId)
    .eq("organization_id", organizationContext.activeOrganization.id)
    .or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
    .maybeSingle();

  if (error) {
    console.error("[messages] Could not load message", { organizationId: organizationContext.activeOrganization.id, messageId, error });
  }

  if (!data) {
    notFound();
  }

  const message = data as InternalMessage;
  const isRecipient = message.recipient_user_id === user.id;
  const unread = isRecipient && !message.read_at;

  return (
    <>
      <PageHeader title="Message" description="Internal organization message." />
      <Toast show={query.error === "read"} tone="error" title="Message not updated" message="Could not mark this message as read. Try again." />
      <MessagesTabs active={message.sender_user_id === user.id ? "Sent" : "Inbox"} />
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CardTitle>{message.subject}</CardTitle>
                {message.read_at ? <Badge>Read</Badge> : <Badge>Unread</Badge>}
              </div>
              <CardDescription>
                From {message.sender_email} to {message.recipient_email} - {new Date(message.created_at).toLocaleString()}
              </CardDescription>
            </div>
            <MailOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-6 dark:bg-zinc-900/60">{message.body}</div>
          {unread ? (
            <form action={markInternalMessageReadAction}>
              <input type="hidden" name="messageId" value={message.id} />
              <Button type="submit" variant="secondary">
                <CheckCircle2 className="h-4 w-4" />
                Mark as read
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
