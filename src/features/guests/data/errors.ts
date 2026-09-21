export class GuestDataError extends Error {
  readonly code = "unavailable" as const;

  constructor(message = "Les invités sont temporairement indisponibles.") {
    super(message);
    this.name = "GuestDataError";
  }
}

export function isGuestDataError(error: unknown): error is GuestDataError {
  return error instanceof GuestDataError;
}
