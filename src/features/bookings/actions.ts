"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bookingFormSchema } from "./model/schema";
import type { Booking, BookingFormValues, BookingStatus } from "./model/types";

export type BookingActionResult = {
  error?: string;
};

type BookingRow = {
  id: string;
  user_id: string;
  property_id: string;
  guest_name: string;
  phone: string;
  check_in: string;
  check_out: string;
  amount: number;
  status: BookingStatus;
  comment: string | null;
  created_at: string;
  properties: {
    title: string;
  } | null;
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

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    user_id: row.user_id,
    property_id: row.property_id,
    property_title: row.properties?.title ?? "Объект удален",
    guest_name: row.guest_name,
    phone: row.phone,
    check_in: row.check_in,
    check_out: row.check_out,
    amount: Number(row.amount),
    status: row.status,
    comment: row.comment,
    created_at: row.created_at,
  };
}

function toPayload(values: BookingFormValues, userId: string) {
  return {
    user_id: userId,
    property_id: values.property_id,
    guest_name: values.guest_name.trim(),
    phone: values.phone.trim(),
    check_in: values.check_in,
    check_out: values.check_out,
    amount: Number(values.amount),
    status: values.status,
    comment: values.comment.trim() || null,
  };
}

async function userOwnsProperty(propertyId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Не удалось проверить объект");
  }

  return Boolean(data);
}

export async function getBookings(): Promise<Booking[]> {
  const userId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id,user_id,property_id,guest_name,phone,check_in,check_out,amount,status,comment,created_at,properties(title)")
    .eq("user_id", userId)
    .order("check_in", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<BookingRow[]>();

  if (error) {
    throw new Error("Не удалось загрузить брони");
  }

  return data.map(mapBooking);
}

export async function createBookingAction(
  values: BookingFormValues,
): Promise<BookingActionResult> {
  const parsedValues = bookingFormSchema.safeParse(values);

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0]?.message ?? "Проверьте поля брони" };
  }

  const userId = await getCurrentUserId();
  const ownsProperty = await userOwnsProperty(parsedValues.data.property_id, userId);

  if (!ownsProperty) {
    return { error: "Выберите свой объект" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .insert(toPayload(parsedValues.data, userId));

  if (error) {
    return { error: "Не удалось создать бронь" };
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return {};
}

export async function updateBookingAction(
  bookingId: string,
  values: BookingFormValues,
): Promise<BookingActionResult> {
  const parsedValues = bookingFormSchema.safeParse(values);

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0]?.message ?? "Проверьте поля брони" };
  }

  const userId = await getCurrentUserId();
  const ownsProperty = await userOwnsProperty(parsedValues.data.property_id, userId);

  if (!ownsProperty) {
    return { error: "Выберите свой объект" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update(toPayload(parsedValues.data, userId))
    .eq("id", bookingId)
    .eq("user_id", userId);

  if (error) {
    return { error: "Не удалось обновить бронь" };
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBookingAction(
  bookingId: string,
): Promise<BookingActionResult> {
  const userId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("user_id", userId);

  if (error) {
    return { error: "Не удалось удалить бронь" };
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return {};
}
