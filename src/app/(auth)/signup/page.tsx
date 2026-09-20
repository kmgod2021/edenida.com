import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Créer un compte",
};

export default function SignUpPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-3xl text-ink">
        Edenida
      </Link>
      <h1 className="mt-8 text-2xl font-medium text-ink">Créer un compte</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Commencez à organiser votre mariage dans un seul espace.
      </p>

      {!configured ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-line bg-bg-elevated p-4 text-sm text-ink-muted"
        >
          Supabase n&apos;est pas encore configuré. Ajoutez{" "}
          <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
          <code className="text-ink">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
          dans <code className="text-ink">.env.local</code>.
        </div>
      ) : (
        <SignUpForm />
      )}

      <p className="mt-8 text-sm text-ink-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-accent underline-offset-2 hover:underline">
          Connexion
        </Link>
      </p>
    </main>
  );
}
