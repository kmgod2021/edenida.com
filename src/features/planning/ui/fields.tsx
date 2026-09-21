import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { fieldClassName, labelClassName } from "./styles";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelClassName}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClassName} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={fieldClassName} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldClassName} />;
}

export function readText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

export function readNullable(data: FormData, key: string): string | null {
  const value = readText(data, key).trim();
  return value.length === 0 ? null : value;
}

export function domId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "-");
}
