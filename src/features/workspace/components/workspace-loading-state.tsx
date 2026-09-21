export function WorkspaceLoadingState() {
  return (
    <div
      role="status"
      aria-label="Chargement de l'espace mariage"
      aria-busy="true"
      className="mx-auto w-full max-w-3xl flex-1 px-6 py-16"
    >
      <p className="text-sm text-ink-muted">Chargement…</p>
      <div className="mt-8 h-10 w-48 animate-pulse bg-line" />
      <div className="mt-6 h-4 w-64 max-w-full animate-pulse bg-line" />
      <div className="mt-10 h-1 w-full animate-pulse bg-line" />
    </div>
  );
}
