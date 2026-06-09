"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { sendInternalMessageAction, type MessageActionState } from "@/app/dashboard/messages/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Input } from "@/components/ui/input";

type TeamMember = {
  user_id: string;
  email: string;
  role: string;
};

const initialState: MessageActionState = { status: "idle", message: "" };

export function MessageComposeForm({ recipients }: { recipients: TeamMember[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [recipientUserId, setRecipientUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [hideSuccessMessage, setHideSuccessMessage] = useState(false);

  async function submitMessage(previousState: MessageActionState, formData: FormData) {
    const result = await sendInternalMessageAction(previousState, formData);

    if (result.status === "success") {
      formRef.current?.reset();
      setRecipientUserId("");
      setSubject("");
      setBody("");
      setValidationMessage("");
      setHideSuccessMessage(false);
    }

    return result;
  }

  const [state, action] = useActionState(submitMessage, initialState);
  const canSend = recipientUserId.trim().length > 0 && subject.trim().length > 0 && body.trim().length > 0;

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
        <select
          name="recipientUserId"
          value={recipientUserId}
          onChange={(event) => {
            setRecipientUserId(event.target.value);
            setValidationMessage("");
            setHideSuccessMessage(true);
          }}
          required
          className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
        >
          <option value="">Choose recipient</option>
          {recipients.map((recipient) => (
            <option key={recipient.user_id} value={recipient.user_id}>
              {recipient.email} ({recipient.role})
            </option>
          ))}
        </select>
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
