import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../src/shared/api/supabase/database.types";
import { assertSafeMutationTarget, e2eEnv } from "./env";

function createStagingAdminClient() {
  assertSafeMutationTarget();

  return createClient<Database>(e2eEnv.supabaseUrl, e2eEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getGuestRequestByName(guestName: string) {
  const admin = createStagingAdminClient();
  const { data, error } = await admin
    .from("guest_requests")
    .select("id, source, room_id, guest_name, base_price_per_night, total_price, pricing_snapshot")
    .eq("guest_name", guestName)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteGuestRequestByName(guestName: string) {
  const admin = createStagingAdminClient();
  const { error } = await admin.from("guest_requests").delete().eq("guest_name", guestName);

  if (error) {
    throw error;
  }
}
