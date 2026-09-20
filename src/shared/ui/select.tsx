"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useId, type ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { FieldWrapper, getFieldDescribedBy } from "@/shared/ui/field-wrapper";
import { AppIcon } from "@/shared/ui/icon";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type TriggerAriaProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "aria-describedby" | "aria-invalid" | "onBlur" | "onFocus"
>;

export type SelectProps = TriggerAriaProps & {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  form?: string;
  placeholder?: string;
  label?: string;
  wrapperClassName?: string;
  className?: string;
  options: SelectOption[];
  description?: string;
  error?: string;
};

export function Select({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  autoComplete,
  form,
  placeholder = "Выберите значение",
  label,
  wrapperClassName,
  className,
  options,
  description,
  error,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onBlur,
  onFocus,
}: SelectProps) {
  const generatedId = useId();
  const resolvedId = id ?? `select-${generatedId.replace(/:/g, "")}`;
  const errorId = error ? `${resolvedId}-error` : undefined;
  const descriptionId = !error && description ? `${resolvedId}-description` : undefined;
  const describedBy = getFieldDescribedBy(errorId ?? descriptionId, ariaDescribedBy);

  return (
    <FieldWrapper
      label={label}
      htmlFor={resolvedId}
      className={wrapperClassName}
      description={description}
      error={error}
      descriptionId={descriptionId}
      errorId={errorId}
    >
      <SelectPrimitive.Root
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        form={form}
      >
        <SelectPrimitive.Trigger
          id={resolvedId}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-errormessage={errorId}
          aria-invalid={error ? true : ariaInvalid}
          onBlur={onBlur}
          onFocus={onFocus}
          className={cn(
            "group/select grid min-h-11 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] leading-[1.45] text-[var(--text)]",
            "transition-[border-color,box-shadow,background-color] duration-[180ms] hover:border-[var(--border-strong)]",
            "focus:outline-none focus-visible:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
            "data-[state=open]:border-[rgb(var(--color-primary-rgb)_/_0.44)] data-[state=open]:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error &&
              "border-[rgb(196_81_81_/_0.28)] focus-visible:border-[rgb(196_81_81_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(196_81_81_/_0.10)] data-[state=open]:border-[rgb(196_81_81_/_0.44)] data-[state=open]:shadow-[0_0_0_4px_rgb(196_81_81_/_0.10)]",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} className="min-w-0 truncate text-left data-[placeholder]:text-[var(--text-subtle)]" />
          <SelectPrimitive.Icon asChild>
            <AppIcon
              icon={ChevronDown}
              className="size-4 text-[var(--text-muted)] transition-transform duration-[180ms] group-data-[state=open]/select:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "z-[70] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] max-w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] shadow-[var(--shadow-md)]",
              "data-[state=open]:animate-[select-content-open_160ms_ease-out] motion-reduce:animate-none",
            )}
            onEscapeKeyDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <SelectPrimitive.ScrollUpButton className="grid h-8 place-items-center bg-[var(--surface)] text-[var(--text-muted)]">
              <AppIcon icon={ChevronUp} className="size-4" aria-hidden="true" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="max-h-[var(--radix-select-content-available-height)] p-1.5">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  textValue={option.label}
                  className={cn(
                    "relative flex min-h-11 cursor-default select-none items-center rounded-[var(--radius-sm)] py-2.5 pl-3 pr-10 leading-[1.45] outline-none",
                    "transition-colors duration-[180ms] data-[highlighted]:bg-[var(--color-primary-pale)] data-[highlighted]:text-[var(--color-primary-hover)]",
                    "data-[state=checked]:bg-[var(--color-primary-soft)] data-[state=checked]:font-semibold data-[state=checked]:text-[var(--accent-strong)]",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-45 motion-reduce:transition-none",
                  )}
                >
                  <SelectPrimitive.ItemText className="min-w-0 whitespace-normal break-words">
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3 grid size-5 place-items-center text-[var(--accent-strong)]">
                    <AppIcon icon={Check} className="size-4" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="grid h-8 place-items-center bg-[var(--surface)] text-[var(--text-muted)]">
              <AppIcon icon={ChevronDown} className="size-4" aria-hidden="true" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FieldWrapper>
  );
}
