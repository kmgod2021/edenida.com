"use client";

import Link from "next/link";

import { formatMoney, formatWeddingDate } from "../domain/dates";
import { WEDDING_TIMEZONE_LABELS } from "../domain/validation";
import type { WeddingTimezoneId } from "../domain/validation";
import type { WeddingSummary } from "../domain/types";
import { focusRing, quietLinkClass } from "./classes";
import { ProgressSummary } from "./progress-summary";
import { useWeddingContext } from "./wedding-provider";
import { WeddingCountdown } from "./wedding-countdown";
import { WeddingMembers } from "./wedding-members";

function timezoneLabel(timeZone: string): string {
  if (timeZone in WEDDING_TIMEZONE_LABELS) {
    return WEDDING_TIMEZONE_LABELS[timeZone as WeddingTimezoneId];
  }
  return timeZone;
}

function websiteLabel(status: WeddingSummary["websiteStatus"]): string {
  if (status === "published") return "Publié";
  if (status === "draft") return "Brouillon en cours";
  return "Pas encore commencé";
}

export function DashboardView() {
  const { viewerUserId, current, summary } = useWeddingContext();
  const weddingId = current.wedding.id;
  const dateLabel = summary.weddingDate
    ? formatWeddingDate(summary.weddingDate)
    : null;
  const budgetLabel =
    summary.budgetPlannedCents === null
      ? "Budget non défini"
      : `${formatMoney(summary.budgetSpentCents ?? 0, summary.currency)} dépensés sur ${formatMoney(summary.budgetPlannedCents, summary.currency)}`;
  const guestLabel =
    summary.guestCount === 0
      ? "Aucun invité"
      : `${summary.rsvpCount} réponses sur ${summary.guestCount} invités`;
  const taskLabel =
    summary.tasksTotal === 0
      ? "Aucune tâche"
      : `${summary.tasksCompleted} / ${summary.tasksTotal} tâches`;

  const modules = [
    { href: `/app/w/${weddingId}/website`, title: "Site web", detail: websiteLabel(summary.websiteStatus) },
    { href: `/app/w/${weddingId}/guests`, title: "Invités", detail: guestLabel },
    { href: `/app/w/${weddingId}/checklist`, title: "Checklist", detail: taskLabel },
    { href: `/app/w/${weddingId}/budget`, title: "Budget", detail: budgetLabel },
    { href: `/app/w/${weddingId}/vendors`, title: "Prestataires", detail: "Pas encore commencé" },
  ];

  return (
    <div>
      <p className="text-sm text-ink-muted">Tableau de bord</p>
      <h1 className="mt-2 font-display text-4xl leading-tight text-ink md:text-5xl">
        {current.wedding.title}
      </h1>
      <p className="mt-3 text-ink-muted">
        {dateLabel ?? "Date à choisir"}
        {" · "}
        {timezoneLabel(summary.timezone)}
        {" · "}
        {summary.currency}
      </p>
      <WeddingCountdown
        daysUntil={summary.daysUntil}
        settingsHref={`/app/w/${weddingId}/settings`}
      />
      <ProgressSummary percent={summary.progress.percent} steps={summary.progress.steps} />
      <section aria-labelledby="modules-heading" className="mt-12">
        <h2 id="modules-heading" className="font-display text-3xl text-ink">
          Modules
        </h2>
        <ul className="mt-4">
          {modules.map((module) => (
            <li key={module.href} className="border-b border-line">
              <Link
                href={module.href}
                className={`flex items-baseline justify-between gap-4 py-3 ${focusRing}`}
              >
                <span className="text-ink">{module.title}</span>
                <span className="text-right text-sm text-ink-muted">{module.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/app/w/${weddingId}/settings`}
          className={`${quietLinkClass} mt-4 inline-block`}
        >
          Modifier les réglages
        </Link>
      </section>
      <WeddingMembers
        members={current.members}
        viewerUserId={viewerUserId}
        profileNames={current.profileNames}
        partnerDisplayName={current.partnerDisplayName}
      />
    </div>
  );
}
