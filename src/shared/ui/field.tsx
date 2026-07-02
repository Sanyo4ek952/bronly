import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/cn";

type FieldWrapperProps = {
  label?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  description?: string;
  error?: string;
};

function FieldWrapper({ label, htmlFor, children, className, description, error }: FieldWrapperProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <label className="mb-0.5 text-[var(--label-size)] font-bold leading-[1.4] text-[var(--text-muted)]" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? <span className="text-xs leading-[1.45] text-[var(--danger)]">{error}</span> : null}
      {!error && description ? <span className="text-xs leading-[1.45] text-[var(--text-muted)]">{description}</span> : null}
    </div>
  );
}

const fieldBaseClass = cn(
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] leading-[1.45] text-[var(--text)]",
  "transition-[border-color,box-shadow,background-color] duration-[180ms]",
  "placeholder:text-[var(--text-subtle)]",
  "focus:outline-none focus:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
  description?: string;
  error?: string;
};

export function Input({ label, id, className, wrapperClassName, description, error, ...props }: InputProps) {
  const isFile = props.type === "file";

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      className={wrapperClassName}
      description={description}
      error={error}
    >
      <input
        id={id}
        className={cn(
          fieldBaseClass,
          isFile ? "min-h-14 overflow-hidden p-2" : "min-h-10 px-3 py-2.5",
          isFile &&
            cn(
              "file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-[var(--color-primary-soft)] file:px-[14px] file:py-2.5 file:font-bold file:text-[var(--color-primary-hover)] file:transition-[background-color,transform] file:duration-[180ms]",
              "hover:file:-translate-y-px hover:file:bg-[rgb(var(--color-primary-rgb)_/_0.18)]",
            ),
          error &&
            "border-[rgb(196_81_81_/_0.28)] focus:border-[rgb(196_81_81_/_0.44)] focus:shadow-[0_0_0_4px_rgb(196_81_81_/_0.10)]",
          className,
        )}
        aria-invalid={error ? true : props["aria-invalid"]}
        {...props}
      />
    </FieldWrapper>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  wrapperClassName?: string;
  description?: string;
  error?: string;
};

export function Textarea({
  label,
  id,
  className,
  wrapperClassName,
  description,
  error,
  ...props
}: TextareaProps) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      className={wrapperClassName}
      description={description}
      error={error}
    >
      <textarea
        id={id}
        className={cn(
          fieldBaseClass,
          "min-h-[110px] resize-y px-4 py-[14px]",
          error &&
            "border-[rgb(196_81_81_/_0.28)] focus:border-[rgb(196_81_81_/_0.44)] focus:shadow-[0_0_0_4px_rgb(196_81_81_/_0.10)]",
          className,
        )}
        aria-invalid={error ? true : props["aria-invalid"]}
        {...props}
      />
    </FieldWrapper>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  wrapperClassName?: string;
  options?: Array<{ label: string; value: string }>;
  description?: string;
  error?: string;
};

export function Select({
  label,
  id,
  className,
  wrapperClassName,
  options,
  description,
  error,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      className={wrapperClassName}
      description={description}
      error={error}
    >
      <select
        id={id}
        className={cn(
          fieldBaseClass,
          "min-h-10 appearance-none px-3 py-2.5",
          error &&
            "border-[rgb(196_81_81_/_0.28)] focus:border-[rgb(196_81_81_/_0.44)] focus:shadow-[0_0_0_4px_rgb(196_81_81_/_0.10)]",
          className,
        )}
        aria-invalid={error ? true : props["aria-invalid"]}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
    </FieldWrapper>
  );
}
