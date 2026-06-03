import { getOwnerRequests } from "@/entities/request";
import { RequestsBrowser } from "@/widgets/requests-browser";
import {
  acceptOwnerRequestAction,
  completeOwnerRequestAction,
  rejectOwnerRequestAction,
} from "@/app/dashboard/requests/actions";

export default async function RequestsPage() {
  const requests = await getOwnerRequests();

  if (!requests[0]) {
    return (
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Заявки</h2>
            <p>Пока нет новых запросов на проживание.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="br-dashboard-block br-card">
      <RequestsBrowser
        requests={requests}
        acceptAction={acceptOwnerRequestAction}
        rejectAction={rejectOwnerRequestAction}
        completeAction={completeOwnerRequestAction}
      />
    </section>
  );
}
