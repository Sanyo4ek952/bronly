import { LoginForm } from "@/features/auth/ui/login-form";
import { PageShell } from "@/shared/ui/page-shell";

export default function LoginPage() {
  return (
    <PageShell
      title="Вход"
      description="Войдите в аккаунт, чтобы открыть личный кабинет."
    >
      <LoginForm />
    </PageShell>
  );
}
