"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/shared/api/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/shared/api/supabase/env";

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return createBrowserClient<Database>(url, anonKey);
}
