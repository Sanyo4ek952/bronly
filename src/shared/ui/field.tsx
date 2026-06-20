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
    <div className={cn("br-form-field", error && "br-form-field--error", className)}>
      {label ? (
        <label className="br-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? <span className="br-form-error">{error}</span> : null}
      {!error && description ? <span className="br-form-help">{description}</span> : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
  description?: string;
  error?: string;
};

export function Input({ label, id, className, wrapperClassName, description, error, ...props }: InputProps) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      className={wrapperClassName}
      description={description}
      error={error}
    >
      <input id={id} className={cn("br-field", props.type === "file" && "br-field--file", className)} {...props} />
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
      <textarea id={id} className={cn("br-textarea", className)} {...props} />
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
      <select id={id} className={cn("br-field", className)} {...props}>
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
