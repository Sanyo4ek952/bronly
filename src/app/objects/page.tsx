import { getProperties } from "@/features/properties/actions";
import { CreatePropertyDialog } from "@/features/properties/ui/create-property-dialog";
import { PropertyList } from "@/features/properties/ui/property-list";
import { PageShell } from "@/shared/ui/page-shell";

export default async function ObjectsPage() {
  const properties = await getProperties();

  return (
    <PageShell
      title="Объекты"
      description="Список квартир, домов и апартаментов для посуточной аренды."
    >
      <div className="flex justify-start">
        <CreatePropertyDialog />
      </div>
      <PropertyList properties={properties} />
    </PageShell>
  );
}
