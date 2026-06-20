import { StatusPill } from "@/shared/ui";

type StatusBadgeProps =
  | {
      kind: "property";
      published: boolean;
      isFrozen: boolean;
    }
  | {
      kind: "room";
      isActive: boolean;
    };

export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === "room") {
    return <StatusPill variant={props.isActive ? "active" : "inactive"}>{props.isActive ? "Активен" : "Неактивен"}</StatusPill>;
  }

  const active = props.published && !props.isFrozen;
  const label = props.isFrozen ? "Заморожен" : props.published ? "Опубликован" : "Скрыт";

  return <StatusPill variant={active ? "active" : "inactive"}>{label}</StatusPill>;
}
