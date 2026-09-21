export class FinancePersistenceError extends Error {
  readonly code: "INVALID_JSON" | "INVALID_SCHEMA" | "STORAGE_UNAVAILABLE";

  constructor(
    code: FinancePersistenceError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "FinancePersistenceError";
    this.code = code;
  }
}
