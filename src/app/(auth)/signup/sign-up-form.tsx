"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validations/auth";

export function SignUpForm({ emailRedirectTo }: { emailRedirectTo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.fullName },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setPending(false);
        return;
      }

      if (!data.session) {
        setAwaitingConfirmation(true);
        setPending(false);
        return;
      }

      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
      setPending(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div
        role="status"
        className="mt-8 rounded-md border border-line bg-bg-elevated p-4"
      >
        <h2 className="text-lg font-medium text-ink">Check your email</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Un lien de confirmation a été envoyé. Ouvrez-le pour activer votre
          compte, puis connectez-vous.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="fullName" className="block text-sm font-medium text-ink">
          Nom
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          className="w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bg-elevated transition hover:bg-ink/90 disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
