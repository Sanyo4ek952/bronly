import Link from "next/link";

import { createOwnerProperty } from "@/app/dashboard/properties/actions";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav } from "@/shared/ui";

type NewPropertyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string) {
  switch (error) {
    case "validation":
      return "Заполните обязательные поля объекта.";
    case "duplicate":
      return "Не удалось создать объект. Попробуйте изменить название.";
    default:
      return error ? "Не удалось создать объект." : "";
  }
}

export default async function NewPropertyPage({ searchParams }: NewPropertyPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const message = getMessage(error);

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: "Новый объект" }])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Новый объект</h2>
            <p>Создайте объект владельца и сразу подготовьте его к публикации и приёму заявок.</p>
          </div>
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <form action={createOwnerProperty} className="br-owner-stack">
          <OwnerPropertyFormFields />

          <div className="br-active-step__actions">
            <Link href="/dashboard/properties" className="br-button br-button--secondary">
              К списку объектов
            </Link>
            <Button type="submit">Создать объект</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
