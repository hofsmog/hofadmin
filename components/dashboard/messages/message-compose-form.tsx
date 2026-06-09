"use client";

import { Search, UserRound } from "lucide-react";
import { useActionState, useMemo, useRef, useState } from "react";
import { sendInternalMessageAction, type MessageActionState } from "@/app/dashboard/messages/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Input } from "@/components/ui/input";
import { formatFileSize, getMessageDisplayName } from "@/lib/messages";
import { cn } from "@/lib/utils";

type TeamMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
};

const initialState: MessageActionState = { status: "idle", message: "" };

export function MessageComposeForm({ recipients }: { recipients: TeamMember[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [recipientUserId, setRecipientUserId] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [hideSuccessMessage, setHideSuccessMessage] = useState(false);

  async function submitMessage(previousState: MessageActionState, formData: FormData) {
    const result = await sendInternalMessageAction(previousState, formData);

    if (result.status === "success") {
      formRef.current?.reset();
      setRecipientUserId("");
      setRecipientSearch("");
      setSubject("");
      setBody("");
      setSelectedFiles([]);
      setValidationMessage("");
      setHideSuccessMessage(false);
    }

    return result;
  }

  const [state, action] = useActionState(submitMessage, initialState);
  const canSend = recipientUserId.trim().length > 0 && subject.trim().length > 0 && body.trim().length > 0;
  const selectedRecipient = recipients.find((recipient) => recipient.user_id === recipientUserId);
  const filteredRecipients = recipients.filter((recipient) =>
    getMessageDisplayName(recipient.user_id, recipients).toLowerCase().includes(recipientSearch.trim().toLowerCase()),
  );

  const helperMessage = useMemo(() => {
    if (state.status === "success") {
      return "";
    }

    if (validationMessage) {
      return validationMessage;
    }

    if (!recipientUserId) {
      return "Please select a recipient.";
    }

    if (!subject.trim()) {
      return "Please enter a subject.";
    }

    if (!body.trim()) {
      return "Please enter a message.";
    }

    return "";
  }, [body, recipientUserId, state.status, subject, validationMessage]);

  function validateBeforeSubmit() {
    if (!recipientUserId) {
      setValidationMessage("Please select a recipient.");
      return;
    }

    if (!subject.trim()) {
      setValidationMessage("Please enter a subject.");
      return;
    }

    if (!body.trim()) {
      setValidationMessage("Please enter a message.");
      return;
    }

    setValidationMessage("");
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950">
      <label className="block space-y-2">
        <span className="text-sm font-medium">To</span>
        <input type="hidden" name="recipientUserId" value={recipientUserId} />
        <div className="rounded-xl border bg-white p-2 shadow-sm dark:bg-zinc-950">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/70">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={recipientSearch}
              onChange={(event) => {
                setRecipientSearch(event.target.value);
                setValidationMessage("");
                setHideSuccessMessage(true);
              }}
              placeholder={selectedRecipient ? getMessageDisplayName(selectedRecipient.user_id, recipients) : "Search people by name"}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {selectedRecipient ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{getMessageDisplayName(selectedRecipient.user_id, recipients)}</span>
              </span>
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setRecipientUserId("");
                  setRecipientSearch("");
                  setHideSuccessMessage(true);
                }}
              >
                Change
              </button>
            </div>
          ) : null}
          <div className={cn("mt-2 max-h-56 overflow-y-auto", selectedRecipient && !recipientSearch ? "hidden" : "block")}>
            {filteredRecipients.length ? (
              filteredRecipients.map((recipient) => (
                <button
                  key={recipient.user_id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  onClick={() => {
                    setRecipientUserId(recipient.user_id);
                    setRecipientSearch("");
                    setValidationMessage("");
                    setHideSuccessMessage(true);
                  }}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-semibold dark:bg-zinc-900">
                    {getMessageDisplayName(recipient.user_id, recipients).slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{getMessageDisplayName(recipient.user_id, recipients)}</span>
                    <span className="block text-xs capitalize text-muted-foreground">{recipient.role}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No matching people.</p>
            )}
          </div>
        </div>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Subject</span>
        <Input
          name="subject"
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
            setValidationMessage("");
            setHideSuccessMessage(true);
          }}
          maxLength={160}
          required
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Message</span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setValidationMessage("");
            setHideSuccessMessage(true);
          }}
          required
          maxLength={5000}
          rows={8}
          className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Attach files</span>
        <Input
          name="attachments"
          type="file"
          multiple
          onChange={(event) => {
            setSelectedFiles(Array.from(event.target.files ?? []));
            setHideSuccessMessage(true);
          }}
        />
      </label>
      {selectedFiles.length ? (
        <div className="rounded-xl border bg-zinc-50 p-3 text-sm dark:bg-zinc-900/60">
          <p className="font-medium">Selected files</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {selectedFiles.map((file) => (
              <li key={`${file.name}-${file.size}`}>
                {file.name} ({formatFileSize(file.size)})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.status === "error" && state.message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
          {state.message}
        </div>
      ) : null}
      {state.status === "success" && state.message && !hideSuccessMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300">
          {state.message}
        </div>
      ) : null}
      {helperMessage ? <p className="text-sm text-muted-foreground">{helperMessage}</p> : null}
      <ActionSubmitButton pendingLabel="Sending" disabled={!canSend} onClick={validateBeforeSubmit}>
        Send
      </ActionSubmitButton>
    </form>
  );
}
