import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth/actions";

export const metadata = {
  title: "Espace",
};

export default async function AppHomePage() {
  const configured = isSupabaseConfigured();
  let email: string | null = null;

  if (configured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? null;
    } catch {
      email = null;
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-3xl text-ink">
          Edenida
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-ink-muted transition hover:text-ink">
            Accueil
          </Link>
          {email ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-line px-3 py-1.5 text-ink transition hover:bg-bg-elevated"
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-line px-3 py-1.5 text-ink transition hover:bg-bg-elevated"
            >
              Connexion
            </Link>
          )}
        </div>
      </header>

      <section className="mt-12 rounded-lg border border-line bg-bg-elevated/80 p-8 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-4xl text-ink">Votre espace mariage</h1>
        <p className="mt-3 max-w-xl text-ink-muted">
          Foundation Auth + Supabase connectée. La création de projet mariage
          arrive en Phase 3.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-ink-muted">
          <li>
            Session :{" "}
            <strong className="text-ink">
              {email ? `connecté (${email})` : "anonyme"}
            </strong>
          </li>
          <li>
            Supabase configuré :{" "}
            <strong className="text-ink">{configured ? "oui" : "non"}</strong>
          </li>
        </ul>
      </section>
    </main>
  );
}
