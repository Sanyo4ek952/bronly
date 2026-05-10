"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  type PropertyFormValues,
  propertySchema,
} from "@/entities/property/model/schema";
import type { Property } from "@/entities/property/model/types";
import {
  createPropertyAction,
  type PropertyActionResult,
  updatePropertyAction,
} from "@/features/properties/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

type PropertyFormProps = Readonly<{
  property?: Property;
  onSuccess?: () => void;
}>;

const defaultValues: PropertyFormValues = {
  title: "",
  description: "",
  city: "",
  district: "",
  address: "",
  price_per_day: 1,
  max_guests: 1,
  is_active: true,
};

function getPropertyFormValues(property?: Property): PropertyFormValues {
  if (!property) {
    return defaultValues;
  }

  return {
    title: property.title,
    description: property.description ?? "",
    city: property.city,
    district: property.district ?? "",
    address: property.address,
    price_per_day: property.price_per_day,
    max_guests: property.max_guests,
    is_active: property.is_active,
  };
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const router = useRouter();
  const [actionResult, setActionResult] = useState<PropertyActionResult>({});
  const [isPending, startTransition] = useTransition();
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: getPropertyFormValues(property),
  });

  const onSubmit = form.handleSubmit((values) => {
    setActionResult({});
    startTransition(() => {
      const action = property
        ? updatePropertyAction(property.id, values)
        : createPropertyAction(values);

      void action.then((result) => {
        setActionResult(result);

        if (!result.error) {
          if (!property) {
            form.reset(defaultValues);
          }

          router.refresh();
          onSuccess?.();
        }
      });
    });
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-1.5">
        <Input
          placeholder="Название"
          aria-invalid={Boolean(form.formState.errors.title)}
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Textarea
          placeholder="Описание"
          aria-invalid={Boolean(form.formState.errors.description)}
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Input
            placeholder="Город"
            aria-invalid={Boolean(form.formState.errors.city)}
            {...form.register("city")}
          />
          {form.formState.errors.city ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.city.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Input
            placeholder="Район"
            aria-invalid={Boolean(form.formState.errors.district)}
            {...form.register("district")}
          />
          {form.formState.errors.district ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.district.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Input
          placeholder="Адрес"
          aria-invalid={Boolean(form.formState.errors.address)}
          {...form.register("address")}
        />
        {form.formState.errors.address ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.address.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Input
            type="number"
            min={1}
            placeholder="Цена за сутки"
            aria-invalid={Boolean(form.formState.errors.price_per_day)}
            {...form.register("price_per_day", { valueAsNumber: true })}
          />
          {form.formState.errors.price_per_day ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.price_per_day.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Input
            type="number"
            min={1}
            placeholder="Гостей"
            aria-invalid={Boolean(form.formState.errors.max_guests)}
            {...form.register("max_guests", { valueAsNumber: true })}
          />
          {form.formState.errors.max_guests ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.max_guests.message}
            </p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          className="size-4 rounded border-input"
          type="checkbox"
          {...form.register("is_active")}
        />
        Активен
      </label>

      {actionResult.error ? (
        <p className="text-sm text-destructive">{actionResult.error}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Сохранение..."
          : property
            ? "Сохранить изменения"
            : "Создать объект"}
      </Button>
    </form>
  );
}
