import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Espace",
};

export default function AppHomePage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-3xl text-ink">
          Edenida
        </Link>
        <Link
          href="/"
          className="text-sm text-ink-muted transition hover:text-ink"
        >
          Accueil
        </Link>
      </header>

      <section className="mt-12 rounded-lg border border-line bg-bg-elevated/80 p-8 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-4xl text-ink">Votre espace mariage</h1>
        <p className="mt-3 max-w-xl text-ink-muted">
          La fondation applicative est en place. La création de projet mariage
          arrive en Phase 3.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-ink-muted">
          <li>Auth UI prête (signup / login)</li>
          <li>Clients Supabase SSR + middleware session</li>
          <li>Design system v0 (tokens)</li>
          <li>
            Supabase configuré :{" "}
            <strong className="text-ink">{configured ? "oui" : "non"}</strong>
          </li>
        </ul>
      </section>
    </main>
  );
}
