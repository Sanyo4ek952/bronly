import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CalendarLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function CalendarLayout({ children }: CalendarLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
