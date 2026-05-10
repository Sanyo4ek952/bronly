"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { PropertyForm } from "@/features/properties/ui/property-form";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

export function CreatePropertyDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon />
          Добавить объект
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый объект жилья</DialogTitle>
          <DialogDescription>
            Заполните базовые данные объекта. Фото добавим отдельным шагом.
          </DialogDescription>
        </DialogHeader>
        <PropertyForm onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
