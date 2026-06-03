import { getOwnerProperties, getOwnerPropertyDetail } from "@/entities/property";
import { getOwnerRequests } from "@/entities/request";
import { RequestsBrowser } from "@/widgets/requests-browser";

export default async function RequestsPage() {
  const [requests, properties] = await Promise.all([getOwnerRequests(), getOwnerProperties()]);
  const property = properties[0] ? await getOwnerPropertyDetail(properties[0].id) : null;

  if (!requests[0] || !property) {
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
      <RequestsBrowser requests={requests} rooms={property.rooms} />
    </section>
  );
}
