import { cn } from "@/shared/lib/cn";

export const inventoryFieldClass = cn(
  "h-11 w-full min-w-0 rounded-[14px] border border-[var(--border)]",
  "bg-[rgb(255_255_255_/_0.96)] px-4 text-sm text-[var(--text)] outline-none",
  "transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[var(--text-muted)]",
  "focus:border-[rgb(var(--color-primary-rgb)_/_0.52)] focus:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.10)]",
);

export const inventorySelectClass = cn(inventoryFieldClass, "appearance-none pr-10");

export const inventoryPrimaryButtonClass = cn(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-[22px]",
  "text-sm font-bold leading-none text-white",
  "bg-[var(--color-primary)] [box-shadow:0_10px_22px_rgb(var(--color-primary-rgb)_/_0.18)]",
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
  "hover:-translate-y-px hover:bg-[var(--color-primary-hover)] active:translate-y-0",
);

export const inventorySecondaryButtonClass = cn(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-[18px]",
  "border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-bold leading-none text-[var(--color-text)]",
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
  "hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.32)] hover:bg-[var(--color-primary-pale)] active:translate-y-0",
);

export const inventoryGradientButtonClass = cn(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-[18px]",
  "border border-transparent text-sm font-bold leading-none text-white",
  "bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-hover))]",
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
  "hover:-translate-y-px hover:bg-[linear-gradient(180deg,var(--color-primary-hover),var(--color-primary-hover))] active:translate-y-0",
);

export const inventorySurfaceButtonClass = cn(
  "inline-flex min-h-11 items-center justify-center rounded-[14px] border px-[14px]",
  "border-[var(--color-border)] bg-white text-[var(--color-text)]",
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
  "hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)] active:translate-y-0",
);

export const inventoryIconButtonClass = cn(
  inventorySurfaceButtonClass,
  "size-10 min-h-10 p-0",
);

export const inventoryMenuButtonClass = cn(
  inventorySurfaceButtonClass,
  "size-11 min-h-11 min-w-11 p-0 text-[rgb(16_24_40_/_0.64)]",
);

export const inventoryMenuListClass = cn(
  "absolute right-0 top-[calc(100%+8px)] z-10 grid min-w-[190px] gap-0 rounded-2xl border",
  "border-[var(--color-border)] bg-[rgb(255_255_255_/_0.98)] p-2.5 [box-shadow:var(--shadow-md)]",
);
