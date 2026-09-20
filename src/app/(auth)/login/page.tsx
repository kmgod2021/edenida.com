import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-3xl text-ink">
        Edenida
      </Link>
      <h1 className="mt-8 text-2xl font-medium text-ink">Connexion</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Retrouvez votre espace mariage.
      </p>

      {!configured ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-line bg-bg-elevated p-4 text-sm text-ink-muted"
        >
          Supabase n&apos;est pas encore configuré. Ajoutez les variables
          d&apos;environnement dans <code className="text-ink">.env.local</code>.
        </div>
      ) : (
        <LoginForm />
      )}

      <p className="mt-8 text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-accent underline-offset-2 hover:underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
