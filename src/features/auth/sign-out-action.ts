"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
