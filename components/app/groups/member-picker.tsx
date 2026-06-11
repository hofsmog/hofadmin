"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GroupPickerMember = {
  user_id: string;
  display_name: string | null;
};

export function GroupMemberPicker({ members }: { members: GroupPickerMember[] }) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return members.slice(0, 8);
    }

    return members
      .filter((member) => getMemberName(member).toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [members, query]);

  return (
    <div className="space-y-3">
      <input type="hidden" name="userId" value={selectedUserId} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">Search person</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a name"
        />
      </label>
      <div className="space-y-2">
        {filteredMembers.map((member) => {
          const selected = selectedUserId === member.user_id;

          return (
            <button
              key={member.user_id}
              type="button"
              onClick={() => setSelectedUserId(member.user_id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                selected
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900",
              )}
            >
              <span>{getMemberName(member)}</span>
              {selected ? <span className="text-xs">Selected</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getMemberName(member: GroupPickerMember) {
  return member.display_name?.trim() || "Team member";
}
