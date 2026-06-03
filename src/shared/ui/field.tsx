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
};

function FieldWrapper({ label, htmlFor, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("br-form-field", className)}>
      {label ? (
        <label className="br-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
};

export function Input({ label, id, className, wrapperClassName, ...props }: InputProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} className={wrapperClassName}>
      <input id={id} className={cn("br-field", className)} {...props} />
    </FieldWrapper>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  wrapperClassName?: string;
};

export function Textarea({ label, id, className, wrapperClassName, ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} className={wrapperClassName}>
      <textarea id={id} className={cn("br-textarea", className)} {...props} />
    </FieldWrapper>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  wrapperClassName?: string;
  options?: Array<{ label: string; value: string }>;
};

export function Select({
  label,
  id,
  className,
  wrapperClassName,
  options,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} className={wrapperClassName}>
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
