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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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
      <label className="block space-y-2">
        <span className="text-sm font-medium">Search person</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a name"
        />
      </label>
      {selectedUserIds.map((userId) => (
        <input key={userId} type="hidden" name="userIds" value={userId} />
      ))}
      <div className="space-y-2">
        {filteredMembers.map((member) => {
          const selected = selectedUserIds.includes(member.user_id);

          return (
            <button
              key={member.user_id}
              type="button"
              onClick={() => {
                setSelectedUserIds((current) =>
                  current.includes(member.user_id)
                    ? current.filter((userId) => userId !== member.user_id)
                    : [...current, member.user_id],
                );
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                selected
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900",
              )}
            >
              <span>{getMemberName(member)}</span>
              <span className="text-xs">{selected ? "Selected" : "Add"}</span>
            </button>
          );
        })}
      </div>
      {selectedUserIds.length ? (
        <p className="text-xs text-muted-foreground">
          {selectedUserIds.length} {selectedUserIds.length === 1 ? "member" : "members"} selected
        </p>
      ) : null}
    </div>
  );
}

function getMemberName(member: GroupPickerMember) {
  return member.display_name?.trim() || "Team member";
}
