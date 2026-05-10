import Link from "next/link";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/shared/ui/button";

type NavigationItem = {
  href: string;
  label: string;
};

const privateNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Панель" },
  { href: "/objects", label: "Объекты" },
  { href: "/bookings", label: "Брони" },
  { href: "/calendar", label: "Календарь" },
  { href: "/collections", label: "Подборки" },
];

export async function MainNavigation() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-sand-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link className="text-lg font-semibold tracking-tight text-graphite-900" href="/">
          Bronly
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {user
            ? privateNavigation.map((item) => (
                <Button key={item.href} asChild variant="ghost" size="sm">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))
            : null}

          {user ? (
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </form>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  Войти
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">
                  <UserPlus className="h-4 w-4" />
                  Регистрация
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
