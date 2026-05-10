"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type LoginFormValues,
  type RegisterFormValues,
  loginSchema,
  registerSchema,
} from "./model/schemas";

export type AuthActionResult = {
  error?: string;
  message?: string;
};

export async function loginAction(
  values: LoginFormValues,
): Promise<AuthActionResult> {
  const parsedValues = loginSchema.safeParse(values);

  if (!parsedValues.success) {
    return { error: "Проверьте email и пароль" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsedValues.data);

  if (error) {
    return { error: "Не удалось войти. Проверьте email и пароль." };
  }

  redirect("/dashboard");
}

export async function registerAction(
  values: RegisterFormValues,
): Promise<AuthActionResult> {
  const parsedValues = registerSchema.safeParse(values);

  if (!parsedValues.success) {
    return { error: "Проверьте данные регистрации" };
  }

  const supabase = await createSupabaseServerClient();
  const { name, email, password } = parsedValues.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return { error: "Не удалось создать аккаунт. Попробуйте другой email." };
  }

  if (!data.session) {
    return {
      message: "Аккаунт создан. Проверьте почту для подтверждения регистрации.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/login");
}
