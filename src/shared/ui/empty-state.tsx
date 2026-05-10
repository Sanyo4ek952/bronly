import { Card } from "@/shared/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-graphite-900">{title}</h3>
        <p className="text-sm text-graphite-500">{description}</p>
      </div>
    </Card>
  );
}
