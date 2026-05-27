"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, missingSupabaseConfigMessage } from "@/lib/supabase/config";

export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(missingSupabaseConfigMessage);
  }

  return createBrowserClient(config.url, config.anonKey);
}
