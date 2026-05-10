"use client";

import { useCallback, useState, useTransition } from "react";
import {
  createBookingAction,
  deleteBookingAction,
  getBookings,
  updateBookingAction,
} from "@/features/bookings/actions";
import type { Booking, BookingFormValues } from "../model/types";

export function useBookings(initialBookings: Booking[]) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isFetching, startFetching] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const loadBookings = useCallback(async () => {
    setError(null);

    try {
      setBookings(await getBookings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError : new Error("Не удалось загрузить брони."));
    }
  }, []);

  const refetch = useCallback(() => {
    startFetching(() => {
      void loadBookings();
    });
  }, [loadBookings]);

  const create = async (values: BookingFormValues) => {
    const result = await createBookingAction(values);

    if (result.error) {
      throw new Error(result.error);
    }

    await loadBookings();
  };

  const update = async (id: string, values: BookingFormValues) => {
    const result = await updateBookingAction(id, values);

    if (result.error) {
      throw new Error(result.error);
    }

    await loadBookings();
  };

  const remove = async (id: string) => {
    const result = await deleteBookingAction(id);

    if (result.error) {
      throw new Error(result.error);
    }

    await loadBookings();
  };

  return {
    bookings,
    create,
    error,
    isError: Boolean(error),
    isFetching,
    isLoading: false,
    refetch,
    remove,
    update,
  };
}
