import { createSupabaseServerClient } from "@/shared/api/supabase";
import { withFallbackSlug } from "@/shared/lib/slug";

export async function generateUniquePropertySlug(title: string) {
  const supabase = await createSupabaseServerClient();
  const baseSlug = withFallbackSlug(title, "object");

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const { data } = await supabase.from("properties").select("id").eq("slug", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function generateUniqueRoomSlug(propertyId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const baseSlug = withFallbackSlug(title, "room");

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const { data } = await supabase
      .from("rooms")
      .select("id")
      .eq("property_id", propertyId)
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}
