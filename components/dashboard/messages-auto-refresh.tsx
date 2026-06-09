"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MessagesAutoRefresh({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${organizationId}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const record = (payload.new ?? payload.old) as {
            sender_user_id?: string;
            recipient_user_id?: string;
          };

          if (record.sender_user_id === userId || record.recipient_user_id === userId) {
            router.refresh();
          }
        },
      )
      .subscribe();

    const interval = window.setInterval(() => {
      router.refresh();
    }, 30_000);

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [organizationId, router, userId]);

  return null;
}
