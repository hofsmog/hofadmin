import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEventType, Database, Json } from "@/types/database";

export async function recordActivityEvent({
  supabase,
  organizationId,
  type,
  title,
  description,
  actorId,
  metadata = {},
}: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  type: ActivityEventType;
  title: string;
  description?: string | null;
  actorId: string;
  metadata?: Json;
}) {
  const { error } = await supabase.from("activity_events").insert({
    organization_id: organizationId,
    type,
    title,
    description: description ?? null,
    actor_id: actorId,
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}
