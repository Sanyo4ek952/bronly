import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/shared/ui/button";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-wide text-sage-700">
          Bronly
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-graphite-900 sm:text-5xl">
          Личный кабинет для управления посуточной арендой
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Добавляйте свои объекты, ведите брони вручную и смотрите календарь
          занятости только по своим объектам.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/register">Создать аккаунт</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
