import Link from "next/link";
import { primaryButtonClass } from "@/features/website/ui/styles";

export function WebsiteLoadingState() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p role="status" className="font-display text-3xl text-ink">
        Chargement du site…
      </p>
      <p className="mt-3 text-ink-muted">Préparation de l&apos;aperçu.</p>
    </main>
  );
}

export function WebsiteErrorState({ message, retryHref }: { message: string; retryHref: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm text-ink-muted">Edenida</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Impossible de charger le site</h1>
      <p role="alert" className="mt-4 max-w-md leading-relaxed text-ink-muted">
        {message}
      </p>
      <Link href={retryHref} className={`${primaryButtonClass} mt-8 inline-flex w-fit`}>
        Réessayer
      </Link>
    </main>
  );
}
