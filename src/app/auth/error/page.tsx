import Link from "next/link";

export const metadata = {
  title: "Lien de connexion invalide",
};

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-3xl text-ink">
        Edenida
      </Link>
      <h1 className="mt-8 text-2xl font-medium text-ink">
        Lien de connexion invalide
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Ce lien n&apos;est plus valide. Revenez à la connexion et réessayez.
      </p>
      <p className="mt-8 text-sm text-ink-muted">
        <Link
          href="/login"
          className="text-accent underline-offset-2 hover:underline"
        >
          Connexion
        </Link>
      </p>
    </main>
  );
}
