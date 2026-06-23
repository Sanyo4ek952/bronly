import { cn } from "@/shared/lib/cn";

type PropertyStatusBadgeProps = {
  status: "published" | "draft" | "archived";
  label: string;
};

export function PropertyStatusBadge({ status, label }: PropertyStatusBadgeProps) {
  return (
    <span
      className={cn(
        "br-property-hub-status-badge",
        status === "published" && "br-property-hub-status-badge--published",
        status === "draft" && "br-property-hub-status-badge--draft",
        status === "archived" && "br-property-hub-status-badge--archived",
      )}
    >
      <span className="br-property-hub-status-badge__dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
