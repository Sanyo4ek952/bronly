export function buildCollectionSubtitle(itemCount: number, isArchived: boolean) {
  const itemLabel =
    itemCount % 10 === 1 && itemCount % 100 !== 11
      ? "элемент"
      : itemCount % 10 >= 2 && itemCount % 10 <= 4 && (itemCount % 100 < 12 || itemCount % 100 > 14)
        ? "элемента"
        : "элементов";

  return `${itemCount} ${itemLabel}${isArchived ? " · архив" : ""}`;
}
