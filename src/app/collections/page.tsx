import { PageShell } from "@/shared/ui/page-shell";

export default function CollectionsPage() {
  return (
    <PageShell
      title="Подборки"
      description="Подборки объектов для публикации и отправки гостям."
    >
      <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
        Подборки появятся после создания первой подборки.
      </div>
    </PageShell>
  );
}
