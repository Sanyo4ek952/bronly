import {
  acceptOwnerRequestAction,
  completeOwnerRequestAction,
  rejectOwnerRequestAction,
} from "@/app/dashboard/requests/actions";
import { getOwnerRequests } from "@/entities/request";
import { InlineNotice, Panel, SectionHeader } from "@/shared/ui";
import { RequestsBrowser } from "@/widgets/requests-browser";

export default async function RequestsPage() {
  const requests = await getOwnerRequests();

  if (!requests) {
    return (
      <InlineNotice title="Не удалось загрузить заявки" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  if (!requests[0]) {
    return (
      <Panel className="p-4" padding="none">
        <SectionHeader title="Заявки" description="Пока нет новых запросов на проживание." />
      </Panel>
    );
  }

  return (
    <Panel className="grid gap-4 p-4" padding="none">
      <RequestsBrowser
        requests={requests}
        acceptAction={acceptOwnerRequestAction}
        rejectAction={rejectOwnerRequestAction}
        completeAction={completeOwnerRequestAction}
      />
    </Panel>
  );
}
