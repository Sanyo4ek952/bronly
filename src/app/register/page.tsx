import { RegisterForm } from "@/features/auth/ui/register-form";
import { PageShell } from "@/shared/ui/page-shell";

export default function RegisterPage() {
  return (
    <PageShell
      title="Регистрация"
      description="Создайте аккаунт для доступа к объектам и календарю."
    >
      <RegisterForm />
    </PageShell>
  );
}
