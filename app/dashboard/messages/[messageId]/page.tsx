import { notFound } from "next/navigation";
import { CheckCircle2, Download, MailOpen, Paperclip, Reply } from "lucide-react";
import { markInternalMessageReadAction } from "@/app/dashboard/messages/actions";
import { MessagesTabs } from "@/app/dashboard/messages/page";
import { MessageReplyForm } from "@/components/dashboard/messages/message-reply-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { formatFileSize, type InternalMessage, type InternalMessageAttachment } from "@/lib/messages";

const attachmentBucket = "internal-message-attachments";

type AttachmentWithUrl = InternalMessageAttachment & {
  signedUrl: string | null;
};

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
    .select("id, organization_id, conversation_id, parent_message_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject, body, read_at, created_at")
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
  const { data: threadData, error: threadError } = await supabase
    .from("internal_messages")
    .select("id, organization_id, conversation_id, parent_message_id, sender_user_id, recipient_user_id, sender_email, recipient_email, subject, body, read_at, created_at")
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("conversation_id", message.conversation_id)
    .or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  if (threadError) {
    console.error("[messages] Could not load message thread", { organizationId: organizationContext.activeOrganization.id, messageId, error: threadError });
  }

  const thread = ((threadData ?? [message]) as InternalMessage[]).length ? (threadData ?? [message]) as InternalMessage[] : [message];
  const threadMessageIds = thread.map((threadMessage) => threadMessage.id);
  const unreadInThread = thread.some((threadMessage) => threadMessage.recipient_user_id === user.id && !threadMessage.read_at);
  const { data: attachmentData, error: attachmentError } = threadMessageIds.length
    ? await supabase
        .from("internal_message_attachments")
        .select("id, message_id, organization_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at")
        .eq("organization_id", organizationContext.activeOrganization.id)
        .in("message_id", threadMessageIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (attachmentError) {
    console.error("[messages] Could not load message attachments", { organizationId: organizationContext.activeOrganization.id, messageId, error: attachmentError });
  }

  const attachmentsByMessage = new Map<string, AttachmentWithUrl[]>();

  for (const attachment of (attachmentData ?? []) as InternalMessageAttachment[]) {
    const { data: signed } = await supabase.storage.from(attachmentBucket).createSignedUrl(attachment.file_path, 600);
    const attachments = attachmentsByMessage.get(attachment.message_id) ?? [];
    attachments.push({ ...attachment, signedUrl: signed?.signedUrl ?? null });
    attachmentsByMessage.set(attachment.message_id, attachments);
  }

  return (
    <>
      <PageHeader title="Message thread" description="Internal organization conversation." actions={<ButtonLink href="#reply" variant="secondary"><Reply className="h-4 w-4" />Reply</ButtonLink>} />
      <Toast show={query.error === "read"} tone="error" title="Message not updated" message="Could not mark this message as read. Try again." />
      <MessagesTabs active={message.sender_user_id === user.id ? "Sent" : "Inbox"} />
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CardTitle>{message.subject}</CardTitle>
                {unreadInThread ? <Badge>Unread</Badge> : <Badge>Read</Badge>}
              </div>
              <CardDescription>{thread.length} message{thread.length === 1 ? "" : "s"} in this conversation.</CardDescription>
            </div>
            <MailOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            {thread.map((threadMessage) => (
              <article key={threadMessage.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-1 border-b pb-3 text-sm md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{threadMessage.sender_email}</p>
                    <p className="text-muted-foreground">To {threadMessage.recipient_email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(threadMessage.created_at).toLocaleString()}</p>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-6">{threadMessage.body}</div>
                <MessageAttachments attachments={attachmentsByMessage.get(threadMessage.id) ?? []} />
              </article>
            ))}
          </div>
          {unreadInThread ? (
            <form action={markInternalMessageReadAction}>
              <input type="hidden" name="messageId" value={message.id} />
              <input type="hidden" name="conversationId" value={message.conversation_id} />
              <Button type="submit" variant="secondary">
                <CheckCircle2 className="h-4 w-4" />
                Mark thread as read
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
      <div id="reply" className="mt-4 scroll-mt-24">
        <MessageReplyForm parentMessageId={message.id} />
      </div>
    </>
  );
}

function MessageAttachments({ attachments }: { attachments: AttachmentWithUrl[] }) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Paperclip className="h-4 w-4" />
        Attachments
      </div>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex flex-col gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">
              <span className="block truncate font-medium">{attachment.file_name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</span>
            </span>
            {attachment.signedUrl ? (
              <ButtonLink href={attachment.signedUrl} variant="secondary" className="h-9 shrink-0" target="_blank">
                <Download className="h-4 w-4" />
                Download
              </ButtonLink>
            ) : (
              <span className="text-xs text-muted-foreground">Download unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
