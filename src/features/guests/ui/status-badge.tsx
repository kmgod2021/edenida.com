import { rsvpStatusLabel, invitationStatusLabel } from "@/features/guests/domain/labels";
import type { InvitationStatus, RsvpStatus } from "@/features/guests/domain/types";

function badgeClass(tone: "ok" | "warn" | "muted" | "neutral") {
  const tones = {
    ok: "border-accent-2/50 text-success",
    warn: "border-accent/50 text-accent",
    muted: "border-line text-ink-muted",
    neutral: "border-line text-ink",
  } as const;
  return `inline-flex rounded-md border px-2 py-0.5 text-xs ${tones[tone]}`;
}

export function RsvpBadge({ status }: { status: RsvpStatus }) {
  const tone = status === "attending" ? "ok" : status === "declined" ? "muted" : "warn";
  return <span className={badgeClass(tone)}>{rsvpStatusLabel(status)}</span>;
}

export function InvitationBadge({ status }: { status: InvitationStatus }) {
  const tone = status === "not_invited" ? "muted" : status === "save_the_date" ? "warn" : "neutral";
  return <span className={badgeClass(tone)}>{invitationStatusLabel(status)}</span>;
}
