import Image from "next/image";
import Link from "next/link";

import type { OwnerPropertyDetail } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
import { ButtonLink } from "@/shared/ui";

import { ObjectStats } from "./object-stats";
import { StatusBadge } from "./status-badge";

type ObjectSummaryCardProps = {
  property: OwnerPropertyDetail;
  busyRangeCount: number;
  roomsHref: string;
  calendarHref: string;
  publicHref: string;
  publicActionLabel?: string;
  compact?: boolean;
  className?: string;
};

export function ObjectSummaryCard({
  property,
  busyRangeCount,
  roomsHref,
  calendarHref,
  publicHref,
  publicActionLabel = "Открыть публичную страницу",
  compact = false,
  className,
}: ObjectSummaryCardProps) {
  return (
    <section
      className={cn(
        "grid gap-4 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))]",
        compact && "gap-3",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-[22px]">
        {property.coverImageUrl ? (
          <Image
            src={property.coverImageUrl}
            alt={property.title}
            width={1200}
            height={760}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#e3dccf_0%,#c4d4c7_52%,#f1e7d8_100%)]"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="grid gap-4 p-[18px] max-[720px]:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
          <span className="text-sm leading-[1.55] text-[var(--color-muted)]">{property.propertyType}</span>
        </div>

        <div>
          <h2 className="text-[22px] font-semibold leading-[1.1] text-[var(--color-text)]">{property.title}</h2>
          <p className="mt-1 text-sm leading-[1.55] text-[var(--color-muted)]">{[property.city, property.address].filter(Boolean).join(", ")}</p>
        </div>

        <ObjectStats
          items={[
            { label: "Номера", value: String(property.rooms.length) },
            { label: "Активные", value: String(property.rooms.filter((room) => room.isActive).length) },
            { label: "Занятые даты", value: String(busyRangeCount), tone: "accent" },
          ]}
        />

        <div className="grid gap-3">
          <Link href={roomsHref} className="text-sm font-bold text-[var(--color-primary-hover)]">
            Перейти к номерам
          </Link>
          <Link href={calendarHref} className="text-sm font-bold text-[var(--color-primary-hover)]">
            Перейти к календарю
          </Link>
          <Link href={publicHref} className="text-sm font-bold text-[var(--color-primary-hover)]">
            {publicActionLabel}
          </Link>
        </div>

        <div className="grid gap-3">
          {!property.photos.length ? (
            <p className="rounded-2xl border border-[var(--color-border)] bg-[rgb(var(--color-primary-rgb)_/_0.06)] px-[14px] py-3 text-sm leading-[1.5] text-[var(--color-muted)]">
              Добавьте больше фото, чтобы карточка выглядела убедительнее.
            </p>
          ) : null}
          {!property.phone && !property.whatsapp && !property.telegram ? (
            <p className="rounded-2xl border border-[var(--color-border)] bg-[rgb(var(--color-primary-rgb)_/_0.06)] px-[14px] py-3 text-sm leading-[1.5] text-[var(--color-muted)]">
              Заполните контакты для быстрой связи.
            </p>
          ) : null}
          {!property.houseRules.length ? (
            <p className="rounded-2xl border border-[var(--color-border)] bg-[rgb(var(--color-primary-rgb)_/_0.06)] px-[14px] py-3 text-sm leading-[1.5] text-[var(--color-muted)]">
              Укажите правила проживания, чтобы снизить количество уточнений.
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          <ButtonLink href={roomsHref} variant="secondary" fullWidth>
            Номера
          </ButtonLink>
          <ButtonLink href={calendarHref} variant="secondary" fullWidth>
            Календарь
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
