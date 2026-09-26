"use client";

import { primaryButtonClass } from "./classes";

export function WorkspaceErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <section role="alert" className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl text-ink">
        L&apos;espace n&apos;a pas pu s&apos;ouvrir
      </h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        Rien n&apos;a été perdu de ce qui est déjà enregistré dans ce
        navigateur. Vous pouvez réessayer.
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={`mt-8 ${primaryButtonClass}`}>
          Réessayer
        </button>
      ) : null}
    </section>
  );
}
