import { createSupabaseServerClient } from "@/shared/api/supabase";
import { splitLines } from "@/shared/lib/form-data";

function dedupeLabels(labels: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const label of labels) {
    const normalized = label.trim().replace(/\s+/g, " ").toLowerCase();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(label.trim().replace(/\s+/g, " "));
  }

  return unique;
}

export async function replacePropertyLabels(
  propertyId: string,
  featuresRaw: string,
  rulesRaw: string,
) {
  const supabase = await createSupabaseServerClient();
  const features = splitLines(featuresRaw);
  const rules = splitLines(rulesRaw);

  await supabase.from("property_features").delete().eq("property_id", propertyId);
  await supabase.from("property_rules").delete().eq("property_id", propertyId);

  if (features.length) {
    await supabase.from("property_features").insert(
      features.map((label, index) => ({
        property_id: propertyId,
        label,
        sort_order: index,
      })),
    );
  }

  if (rules.length) {
    await supabase.from("property_rules").insert(
      rules.map((label, index) => ({
        property_id: propertyId,
        label,
        sort_order: index,
      })),
    );
  }
}

export async function replaceRoomAmenities(roomId: string, amenitiesRaw: string) {
  const supabase = await createSupabaseServerClient();
  const amenities = dedupeLabels(splitLines(amenitiesRaw));

  await supabase.from("room_amenities").delete().eq("room_id", roomId);

  if (amenities.length) {
    await supabase.from("room_amenities").insert(
      amenities.map((label, index) => ({
        room_id: roomId,
        label,
        sort_order: index,
      })),
    );
  }
}
