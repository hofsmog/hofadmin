"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { replyToInternalMessageAction, type MessageActionState } from "@/app/dashboard/messages/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/messages";

const initialState: MessageActionState = { status: "idle", message: "" };

export function MessageReplyForm({ parentMessageId }: { parentMessageId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [hideSuccessMessage, setHideSuccessMessage] = useState(false);

  async function submitReply(previousState: MessageActionState, formData: FormData) {
    const result = await replyToInternalMessageAction(previousState, formData);

    if (result.status === "success") {
      formRef.current?.reset();
      setBody("");
      setSelectedFiles([]);
      setValidationMessage("");
      setHideSuccessMessage(false);
    }

    return result;
  }

  const [state, action] = useActionState(submitReply, initialState);
  const canSend = body.trim().length > 0;

  const helperMessage = useMemo(() => {
    if (state.status === "success") {
      return "";
    }

    if (validationMessage) {
      return validationMessage;
    }

    if (!body.trim()) {
      return "Please enter a message.";
    }

    return "";
  }, [body, state.status, validationMessage]);

  function validateBeforeSubmit() {
    if (!body.trim()) {
      setValidationMessage("Please enter a message.");
      return;
    }

    setValidationMessage("");
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950">
      <input type="hidden" name="parentMessageId" value={parentMessageId} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">Reply</span>
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
          rows={5}
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
        Send reply
      </ActionSubmitButton>
    </form>
  );
}
