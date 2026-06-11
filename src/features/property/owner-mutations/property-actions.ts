"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { markOwnerReferralMilestone } from "@/entities/referral";
import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getCheckbox, getString } from "@/shared/lib/form-data";

import { mapActionError } from "./lib/errors";
import { replacePropertyLabels } from "./lib/labels";
import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyPathWithState } from "./lib/paths";
import { generateUniquePropertySlug } from "./lib/slugs";

const DEFAULT_TIMEZONE = "(UTC+03:00) Москва";

export async function createOwnerProperty(formData: FormData) {
  const profile = await requireOwnerMutationAccess("/dashboard/properties/new");
  const title = getString(formData, "title");
  const shortTitle = getString(formData, "shortTitle") || title;
  const propertyType = getString(formData, "propertyType");
  const city = getString(formData, "city");
  const address = getString(formData, "address");

  if (!title || !propertyType || !city || !address) {
    redirect("/dashboard/properties/new?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniquePropertySlug(title);
  const payload = {
    owner_id: profile.id,
    title,
    short_title: shortTitle,
    slug,
    property_type: propertyType,
    city,
    address,
    timezone: DEFAULT_TIMEZONE,
    short_description: getString(formData, "shortDescription"),
    full_description: getString(formData, "fullDescription"),
    phone: getString(formData, "phone"),
    whatsapp: getString(formData, "whatsapp"),
    telegram: getString(formData, "telegram"),
    check_in_time: getString(formData, "checkInTime"),
    check_out_time: getString(formData, "checkOutTime"),
    published: getCheckbox(formData, "published"),
    is_frozen: getCheckbox(formData, "isFrozen"),
    allow_agent_inquiries: getCheckbox(formData, "allowAgentInquiries"),
    allow_owner_contact_sharing: getCheckbox(formData, "allowOwnerContactSharing"),
  };

  const { data, error } = await supabase.from("properties").insert(payload).select("id").maybeSingle();

  if (error || !data?.id) {
    redirect(`/dashboard/properties/new?error=${mapActionError(error)}`);
  }

  await replacePropertyLabels(data.id as string, getString(formData, "features"), getString(formData, "houseRules"));
  await markOwnerReferralMilestone(profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  redirect(buildPropertyPathWithState(data.id as string, "property", { success: "created" }));
}

export async function updateOwnerProperty(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId));
  const title = getString(formData, "title");
  const shortTitle = getString(formData, "shortTitle") || title;
  const propertyType = getString(formData, "propertyType");
  const city = getString(formData, "city");
  const address = getString(formData, "address");

  if (!propertyId || !title || !propertyType || !city || !address) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "validation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("properties")
    .update({
      title,
      short_title: shortTitle,
      property_type: propertyType,
      city,
      address,
      timezone: DEFAULT_TIMEZONE,
      short_description: getString(formData, "shortDescription"),
      full_description: getString(formData, "fullDescription"),
      phone: getString(formData, "phone"),
      whatsapp: getString(formData, "whatsapp"),
      telegram: getString(formData, "telegram"),
      check_in_time: getString(formData, "checkInTime"),
      check_out_time: getString(formData, "checkOutTime"),
      published: getCheckbox(formData, "published"),
      is_frozen: getCheckbox(formData, "isFrozen"),
      allow_agent_inquiries: getCheckbox(formData, "allowAgentInquiries"),
      allow_owner_contact_sharing: getCheckbox(formData, "allowOwnerContactSharing"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: mapActionError(error) }));
  }

  await replacePropertyLabels(propertyId, getString(formData, "features"), getString(formData, "houseRules"));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "property", { success: "saved" }));
}

export async function deleteOwnerProperty(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId));
  const confirmation = getString(formData, "confirmation");

  if (!propertyId || confirmation !== "DELETE") {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "delete-confirmation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "delete" }));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties?success=deleted");
}
