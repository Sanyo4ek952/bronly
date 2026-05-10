"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type PropertyFormValues,
  propertySchema,
} from "@/entities/property/model/schema";
import type { Property, PropertyInput } from "@/entities/property/model/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PropertyActionResult = {
  error?: string;
};

type PropertyRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string;
  price_per_day: number;
  max_guests: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

async function getCurrentUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}

function normalizePropertyInput(values: PropertyFormValues): PropertyInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    city: values.city.trim(),
    district: values.district.trim(),
    address: values.address.trim(),
    price_per_day: values.price_per_day,
    max_guests: values.max_guests,
    is_active: values.is_active,
  };
}

function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    city: row.city,
    district: row.district,
    address: row.address,
    price_per_day: row.price_per_day,
    max_guests: row.max_guests,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getProperties(): Promise<Property[]> {
  const userId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id,user_id,title,description,city,district,address,price_per_day,max_guests,is_active,created_at,updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<PropertyRow[]>();

  if (error) {
    throw new Error("Не удалось загрузить объекты жилья");
  }

  return data.map(mapProperty);
}

export async function createPropertyAction(
  values: PropertyFormValues,
): Promise<PropertyActionResult> {
  const parsedValues = propertySchema.safeParse(values);

  if (!parsedValues.success) {
    return { error: "Проверьте данные объекта" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const property = normalizePropertyInput(parsedValues.data);
  const { error } = await supabase.from("properties").insert({
    ...property,
    user_id: userId,
  });

  if (error) {
    return { error: "Не удалось создать объект" };
  }

  revalidatePath("/objects");
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return {};
}

export async function updatePropertyAction(
  propertyId: string,
  values: PropertyFormValues,
): Promise<PropertyActionResult> {
  const parsedValues = propertySchema.safeParse(values);

  if (!parsedValues.success) {
    return { error: "Проверьте данные объекта" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const property = normalizePropertyInput(parsedValues.data);
  const { error } = await supabase
    .from("properties")
    .update(property)
    .eq("id", propertyId)
    .eq("user_id", userId);

  if (error) {
    return { error: "Не удалось обновить объект" };
  }

  revalidatePath("/objects");
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return {};
}

export async function deletePropertyAction(
  propertyId: string,
): Promise<PropertyActionResult> {
  const userId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("user_id", userId);

  if (error) {
    return { error: "Не удалось удалить объект" };
  }

  revalidatePath("/objects");
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return {};
}
