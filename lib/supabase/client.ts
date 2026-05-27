"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, missingSupabaseConfigMessage } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(missingSupabaseConfigMessage);
  }

  return createBrowserClient<Database>(config.url, config.anonKey);
}
