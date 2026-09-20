import { ObjectTabs } from "@/widgets/property-admin";

type PropertySectionNavProps = {
  propertyId: string;
  active: "property" | "rooms" | "calendar";
  appearance?: "pills" | "line";
};

export function PropertySectionNav({ propertyId, active, appearance = "pills" }: PropertySectionNavProps) {
  return (
    <ObjectTabs
      active={active}
      appearance={appearance}
      items={[
        { key: "property", label: "Обзор", href: `/dashboard/properties/${propertyId}` },
        { key: "rooms", label: "Номера", href: `/dashboard/properties/${propertyId}/rooms` },
        { key: "calendar", label: "Календарь", href: `/dashboard/properties/${propertyId}/calendar` },
      ]}
    />
  );
}
