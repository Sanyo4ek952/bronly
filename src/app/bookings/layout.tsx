import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BookingsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function BookingsLayout({ children }: BookingsLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
