"use client";

import { useState, type FormEvent } from "react";
import { sortTimeline } from "../domain/commands";
import type { AddTimelineInput, TimelineItem, WeddingMemberRef } from "../domain/schemas";
import { copy } from "./copy";
import { Field, readNullable, readText, SelectInput, TextArea, TextInput } from "./fields";
import { primaryButtonClassName, quietButtonClassName } from "./styles";

type FormResult = { ok: true } | { ok: false; message: string };

export type TimelineViewProps = {
  items: readonly TimelineItem[];
  members: readonly WeddingMemberRef[];
  onAddItem: (input: AddTimelineInput) => FormResult;
  onRemoveItem: (itemId: string) => void;
};

function memberName(members: readonly WeddingMemberRef[], memberId: string | null): string {
  if (!memberId) return copy.unassigned;
  return members.find((member) => member.id === memberId)?.displayName ?? copy.unassigned;
}

export function TimelineView({ items, members, onAddItem, onRemoveItem }: TimelineViewProps) {
  const [error, setError] = useState<string | null>(null);
  const ordered = sortTimeline(items);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = onAddItem({
      time: readText(data, "time"),
      activity: readText(data, "activity"),
      location: readText(data, "location"),
      responsibleMemberId: readNullable(data, "responsibleMemberId"),
      notes: readText(data, "notes"),
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    form.reset();
  }

  return (
    <div className="mt-8">
      {ordered.length === 0 ? (
        <p className="text-ink">
          {copy.emptyTimeline}{" "}
          <span className="text-ink-muted">{copy.emptyTimelineHint}</span>
        </p>
      ) : (
        <ol className="border-t border-line">
          {ordered.map((item) => (
            <li key={item.id} className="border-b border-line/80 py-5">
              <article>
                <p className="font-display text-3xl text-ink">
                  <time dateTime={item.time}>{item.time}</time>
                </p>
                <h3 className="mt-1 text-ink">{item.activity}</h3>
                <p className="mt-1 text-sm text-ink">
                  {item.location.trim() ? item.location : copy.locationMissing}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {memberName(members, item.responsibleMemberId)}
                </p>
                {item.notes ? <p className="mt-2 text-sm text-ink-muted">{item.notes}</p> : null}
                <button
                  type="button"
                  className={`${quietButtonClassName} mt-2`}
                  onClick={() => onRemoveItem(item.id)}
                >
                  {copy.deleteMoment} {item.activity}
                </button>
              </article>
            </li>
          ))}
        </ol>
      )}

      <form aria-label={copy.addMoment} onSubmit={submit} className="mt-8 border-t border-line pt-6">
        <h2 className="font-display text-3xl text-ink">{copy.addMoment}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={copy.momentTime}>
            <TextInput name="time" type="time" required />
          </Field>
          <Field label={copy.momentActivity}>
            <TextInput name="activity" required maxLength={160} autoComplete="off" />
          </Field>
          <Field label={copy.momentLocation}>
            <TextInput name="location" maxLength={200} autoComplete="off" />
          </Field>
          <Field label={copy.momentOwner}>
            <SelectInput name="responsibleMemberId" defaultValue="">
              <option value="">{copy.unassigned}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={copy.momentNotes}>
            <TextArea name="notes" rows={2} maxLength={2000} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClassName}>
              {copy.addMomentSubmit}
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
