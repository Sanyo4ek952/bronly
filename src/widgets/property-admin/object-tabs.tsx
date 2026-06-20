import Link from "next/link";

type ObjectTabItem = {
  key: string;
  label: string;
  href: string;
};

type ObjectTabsProps = {
  items: ObjectTabItem[];
  active: string;
};

export function ObjectTabs({ items, active }: ObjectTabsProps) {
  return (
    <nav className="br-object-tabs" aria-label="Разделы объекта">
      {items.map((item) => (
        <Link key={item.key} href={item.href} className={`br-tab${item.key === active ? " br-tab--active" : ""}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
