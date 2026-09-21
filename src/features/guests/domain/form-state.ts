export type FieldErrors = Partial<Record<string, string>>;

export type FormState = {
  message: string | null;
  fieldErrors: FieldErrors;
};

export const idleFormState: FormState = {
  message: null,
  fieldErrors: {},
};

export function issuesToFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && fieldErrors[key] === undefined) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
