"use client";

import { useActionState } from "react";
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
  const [state, action] = useActionState(sendInternalMessageAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950">
      <label className="block space-y-2">
        <span className="text-sm font-medium">To</span>
        <select
          name="recipientUserId"
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
        <Input name="subject" maxLength={160} required />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Message</span>
        <textarea
          name="body"
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
      <ActionSubmitButton pendingLabel="Sending">Send</ActionSubmitButton>
    </form>
  );
}
