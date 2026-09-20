import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(232,201,196,0.55),_transparent_55%),linear-gradient(180deg,_#f7f1ea_0%,_#f3ebe2_45%,_#efe4d8_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22%3E%3Cpath fill=%22%232a211c%22 fill-opacity=%220.03%22 d=%22M0 0h120v120H0z%22/%3E%3Cpath fill=%22none%22 stroke=%22%232a211c%22 stroke-opacity=%220.04%22 d=%22M0 60h120M60 0v120%22/%3E%3C/svg%3E')]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-2xl tracking-[0.04em] text-ink">
          Edenida
        </p>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-ink-muted transition hover:text-ink"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-ink px-4 py-2 text-bg-elevated transition hover:bg-ink/90"
          >
            Commencer
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-10">
        <div className="max-w-2xl animate-[fadeRise_700ms_ease-out]">
          <p className="font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-7xl">
            Edenida
          </p>
          <h1 className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-ink sm:text-2xl">
            One wedding. One workspace. Everything organized.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            Créez le site de votre mariage, gérez vos invités et RSVP, suivez
            checklist et budget — avec calme, élégance, et tout au même endroit.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-bg-elevated transition hover:brightness-95"
            >
              Créer mon espace mariage
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-line bg-bg-elevated/70 px-5 py-3 text-sm font-medium text-ink transition hover:bg-bg-elevated"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-line/70 px-6 py-6 text-center text-sm text-ink-muted">
        © {new Date().getFullYear()} Edenida
      </footer>
    </div>
  );
}
