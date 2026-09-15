import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { updatePasswordAction } from "@/app/auth/actions";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { InlineNotice, Input, SubmitButton } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Новый пароль",
  description: "Страница обновления пароля в Bronly.",
  path: "/reset-password",
  index: false,
});

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <AuthShell
      eyebrow="Обновление пароля"
      title="Новый пароль"
      description="Задайте новый пароль для аккаунта Bronly."
      footer={<Link href="/login">Вернуться ко входу</Link>}
    >
      {error ? (
        <InlineNotice tone="error">
          Не удалось обновить пароль. Убедитесь, что пароли совпадают и содержат минимум 8 символов.
        </InlineNotice>
      ) : null}
      <form className="grid gap-4" action={updatePasswordAction}>
        <Input id="password" name="password" type="password" label="Новый пароль" placeholder="Минимум 8 символов" required />
        <Input id="confirm-password" name="confirmPassword" type="password" label="Повторите пароль" placeholder="Повторите пароль" required />
        <SubmitButton fullWidth pendingLabel="Сохранение">Сохранить пароль</SubmitButton>
      </form>
    </AuthShell>
  );
}
