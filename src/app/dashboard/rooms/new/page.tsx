import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { RoomCreationForm } from "@/features/property/setup/ui/room-creation-form";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs, readSearchParams } from "@/shared/lib";
import { DashboardPageNav, InlineNotice } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";

type StandaloneRoomCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";

export default async function StandaloneRoomCreatePage({ searchParams }: StandaloneRoomCreatePageProps) {
  const params = await readSearchParams(searchParams);
  const error = typeof params.error === "string" ? params.error : "";
  const notice = getRoomCreateNotice(error);
  const profile = await getCurrentAuthProfile();
  const subscription = profile ? await getSubscriptionRuntimeState(profile.id, "owner") : null;

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: "Новый номер" },
        ])}
        compact
      />

      <AdminPageHeader
        variant="plain"
        title="Новый отдельный номер"
        description="Создайте самостоятельный номер без объекта. Он попадет в общий список и в отдельный блок на публичной странице владельца."
      />

      {notice || profile ? (
        <div className="grid gap-3">
          {notice ? <InlineNotice tone="error">{notice}</InlineNotice> : null}
          {profile ? (
            <InlineNotice tone={subscription?.isRoomLimitReached ? "warning" : "soft"}>
              {subscription?.isRoomLimitReached
                ? "Лимит активных номеров исчерпан. Архивируйте один из текущих номеров или увеличьте лимит подписки."
                : "После создания номер сразу появится на публичной странице и займёт одно место в общем лимите активных номеров."}
            </InlineNotice>
          ) : null}
        </div>
      ) : null}

      <RoomCreationForm disabled={subscription?.isRoomLimitReached} />
    </section>
  );
}
