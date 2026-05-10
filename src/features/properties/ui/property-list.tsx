"use client";

import { Edit2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Property } from "@/entities/property/model/types";
import { deletePropertyAction } from "@/features/properties/actions";
import { PropertyForm } from "@/features/properties/ui/property-form";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

type PropertyListProps = Readonly<{
  properties: Property[];
}>;

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function PropertyList({ properties }: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
        Объекты появятся здесь после добавления первой карточки жилья.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

function PropertyCard({ property }: Readonly<{ property: Property }>) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startTransition(() => {
      void deletePropertyAction(property.id).then((result) => {
        if (result.error) {
          setDeleteError(result.error);
          return;
        }

        router.refresh();
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{property.title}</CardTitle>
        <CardDescription>
          {property.city}
          {property.district ? `, ${property.district}` : ""}
        </CardDescription>
        <CardAction>
          <Badge variant={property.is_active ? "default" : "outline"}>
            {property.is_active ? "Активен" : "Скрыт"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        {property.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {property.description}
          </p>
        ) : null}

        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Адрес</dt>
            <dd className="text-right">{property.address}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Цена</dt>
            <dd className="font-medium">
              {priceFormatter.format(property.price_per_day)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Гостей</dt>
            <dd>{property.max_guests}</dd>
          </div>
        </dl>

        {deleteError ? (
          <p className="text-sm text-destructive">{deleteError}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Edit2Icon />
                Редактировать
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Редактирование объекта</DialogTitle>
                <DialogDescription>
                  Изменения сохраняются только для текущего аккаунта.
                </DialogDescription>
              </DialogHeader>
              <PropertyForm
                property={property}
                onSuccess={() => setIsEditOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
          >
            <Trash2Icon />
            {isPending ? "Удаление..." : "Удалить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
