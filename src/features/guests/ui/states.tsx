import type { ReactNode } from "react";

import { buttonClass } from "@/features/guests/ui/styles";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-line bg-bg-elevated/80 px-6 py-10">
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <p className="font-display text-3xl text-ink">Edenida</p>
      <h1 className="mt-8 font-display text-4xl text-ink">{title}</h1>
      <p role="alert" className="mt-4 leading-relaxed text-ink-muted">
        {body}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </main>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="font-display text-3xl text-ink">Edenida</p>
      <p role="status" className="mt-8 text-ink-muted">
        {label}
      </p>
    </main>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={buttonClass}>
      {children}
    </a>
  );
}
