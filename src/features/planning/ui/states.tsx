import type { PlanningLoadError } from "../persistence/storage-repository";
import { copy } from "./copy";
import { primaryButtonClassName } from "./styles";

export function PlanningLoading() {
  return (
    <p role="status" className="mt-10 text-ink-muted">
      {copy.loading}
    </p>
  );
}

export function PlanningError({
  error,
  onRetry,
}: {
  error: PlanningLoadError;
  onRetry: () => void;
}) {
  const message = error === "invalid" ? copy.errorInvalid : copy.errorUnavailable;

  return (
    <div className="mt-10 max-w-xl border-t border-line pt-6" role="alert">
      <p className="text-ink">{message}</p>
      <p className="mt-2 text-sm text-ink-muted">{copy.errorHint}</p>
      <button type="button" className={`${primaryButtonClassName} mt-6`} onClick={onRetry}>
        {copy.retry}
      </button>
    </div>
  );
}
