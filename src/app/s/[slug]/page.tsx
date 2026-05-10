import { PageShell } from "@/shared/ui/page-shell";

type SharePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;

  return (
    <PageShell
      title="Публичная страница"
      description={`Публичная ссылка для коллекции или объекта: ${slug}`}
    >
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Здесь будет публичное представление объекта или подборки.
      </div>
    </PageShell>
  );
}
