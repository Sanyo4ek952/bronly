"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginAction, type AuthActionResult } from "@/features/auth/actions";
import {
  type LoginFormValues,
  loginSchema,
} from "@/features/auth/model/schemas";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function LoginForm() {
  const [actionResult, setActionResult] = useState<AuthActionResult>({});
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setActionResult({});
    startTransition(() => {
      void loginAction(values).then(setActionResult);
    });
  });

  return (
    <div className="grid max-w-md gap-4">
      <form className="grid gap-4" onSubmit={onSubmit}>
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
            autoComplete="current-password"
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

        <Button type="submit" disabled={isPending}>
          {isPending ? "Вход..." : "Войти"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link className="font-medium text-foreground underline" href="/register">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
