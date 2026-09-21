import type { ReactNode } from "react";

import type { RouteContext } from "@/features/guests/domain/route-context";
import type { FieldErrors } from "@/features/guests/domain/form-state";
import { fieldClass } from "@/features/guests/ui/styles";

export function RouteFields({
  ctx,
  fields,
}: {
  ctx: RouteContext;
  fields?: Record<string, string>;
}) {
  return (
    <>
      <input type="hidden" name="session" value={ctx.sessionId} />
      <input type="hidden" name="scenario" value={ctx.scenario} />
      {fields
        ? Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
    </>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-danger">
      {message}
    </p>
  );
}

export function TextField({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function SelectField({
  id,
  name,
  label,
  defaultValue,
  children,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass}
      >
        {children}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}

export function fieldError(errors: FieldErrors, key: string) {
  return errors[key];
}
