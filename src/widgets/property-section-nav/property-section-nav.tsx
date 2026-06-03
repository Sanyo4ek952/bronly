import Link from "next/link";

type PropertySectionNavProps = {
  propertyId: string;
  active: "property" | "rooms" | "calendar";
};

export function PropertySectionNav({ propertyId, active }: PropertySectionNavProps) {
  return (
    <div className="br-tab-row">
      <Link
        className={`br-tab ${active === "property" ? "br-tab--active" : ""}`}
        href={`/dashboard/properties/${propertyId}`}
      >
        Объект
      </Link>
      <Link
        className={`br-tab ${active === "rooms" ? "br-tab--active" : ""}`}
        href={`/dashboard/properties/${propertyId}/rooms`}
      >
        Номера
      </Link>
      <Link
        className={`br-tab ${active === "calendar" ? "br-tab--active" : ""}`}
        href={`/dashboard/properties/${propertyId}/calendar`}
      >
        Календарь занятости
      </Link>
    </div>
  );
}
