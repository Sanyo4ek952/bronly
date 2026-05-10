import { Card } from "@/shared/ui/card";

export function EnvNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50 p-5 text-amber-950">
      <h3 className="font-semibold">Supabase не настроен</h3>
      <p className="mt-1 text-sm">
        Заполните `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`, затем выполните SQL из
        `docs/supabase-bookings.sql`.
      </p>
    </Card>
  );
}
