"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerAction, type AuthActionResult } from "@/features/auth/actions";
import {
  type RegisterFormValues,
  registerSchema,
} from "@/features/auth/model/schemas";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function RegisterForm() {
  const [actionResult, setActionResult] = useState<AuthActionResult>({});
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setActionResult({});
    startTransition(() => {
      void registerAction(values).then(setActionResult);
    });
  });

  return (
    <div className="grid max-w-md gap-4">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-1.5">
          <Input
            type="text"
            placeholder="Имя"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Input
            type="password"
            placeholder="Пароль"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {actionResult.error ? (
          <p className="text-sm text-destructive">{actionResult.error}</p>
        ) : null}
        {actionResult.message ? (
          <p className="text-sm text-muted-foreground">{actionResult.message}</p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Создание..." : "Создать аккаунт"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link className="font-medium text-foreground underline" href="/login">
          Войти
        </Link>
      </p>
    </div>
  );
}
