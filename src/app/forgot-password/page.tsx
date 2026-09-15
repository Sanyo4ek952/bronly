import type { Metadata } from "next";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/auth/actions";
import { createSeoMetadata } from "@/shared/lib/seo";
import { InlineNotice, Input, SubmitButton } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Восстановление доступа",
  description: "Страница восстановления пароля в Bronly.",
  path: "/forgot-password",
  index: false,
});

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";

  return (
    <AuthShell
      eyebrow="Восстановление доступа"
      title="Сброс пароля"
      description="Отправим ссылку для смены пароля на ваш email."
      footer={<>Вспомнили пароль? <Link href="/login">Вернуться ко входу</Link></>}
    >
      {error ? <InlineNotice tone="error">Не удалось отправить письмо. Попробуйте еще раз.</InlineNotice> : null}
      {success === "sent" ? (
        <InlineNotice>Письмо отправлено. Проверьте почту и перейдите по ссылке.</InlineNotice>
      ) : null}
      <form className="grid gap-4" action={forgotPasswordAction}>
        <Input id="email" name="email" type="email" label="Email" placeholder="name@example.com" required />
        <SubmitButton fullWidth pendingLabel="Отправка">Отправить ссылку</SubmitButton>
      </form>
    </AuthShell>
  );
}
