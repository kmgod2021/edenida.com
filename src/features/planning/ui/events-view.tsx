"use client";

import { useState, type FormEvent } from "react";
import { sortEvents } from "../domain/commands";
import { formatIsoDate } from "../domain/dates";
import type { AddEventInput, EventKind, PlanningEvent } from "../domain/schemas";
import { copy, eventKindLabel } from "./copy";
import { Field, readNullable, readText, SelectInput, TextArea, TextInput } from "./fields";
import { primaryButtonClassName, quietButtonClassName } from "./styles";

type FormResult = { ok: true } | { ok: false; message: string };

export type EventsViewProps = {
  events: readonly PlanningEvent[];
  onAddEvent: (input: AddEventInput) => FormResult;
  onRemoveEvent: (eventId: string) => void;
};

export function EventsView({ events, onAddEvent, onRemoveEvent }: EventsViewProps) {
  const [error, setError] = useState<string | null>(null);
  const wedding = sortEvents(events.filter((event) => event.kind === "wedding"));
  const planning = sortEvents(events.filter((event) => event.kind === "planning"));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = onAddEvent({
      title: readText(data, "title"),
      kind: readText(data, "kind") as EventKind,
      date: readNullable(data, "date"),
      startTime: readNullable(data, "startTime"),
      endTime: readNullable(data, "endTime"),
      location: readText(data, "location"),
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
      {events.length === 0 ? (
        <p className="text-ink">
          {copy.emptyEvents}{" "}
          <span className="text-ink-muted">{copy.emptyEventsHint}</span>
        </p>
      ) : (
        <div className="grid gap-10">
          <EventGroup title={copy.weddingEvents} events={wedding} onRemoveEvent={onRemoveEvent} />
          <EventGroup
            title={copy.planningEvents}
            events={planning}
            onRemoveEvent={onRemoveEvent}
          />
        </div>
      )}

      <form aria-label={copy.addEvent} onSubmit={submit} className="mt-8 border-t border-line pt-6">
        <h2 className="font-display text-3xl text-ink">{copy.addEvent}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={copy.eventTitle}>
            <TextInput name="title" required maxLength={160} autoComplete="off" />
          </Field>
          <Field label={copy.eventKind}>
            <SelectInput name="kind" defaultValue="wedding">
              {(Object.keys(eventKindLabel) as EventKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {eventKindLabel[kind]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={copy.eventDate}>
            <TextInput name="date" type="date" />
          </Field>
          <Field label={copy.eventLocation}>
            <TextInput name="location" maxLength={200} autoComplete="off" />
          </Field>
          <Field label={copy.eventStart}>
            <TextInput name="startTime" type="time" />
          </Field>
          <Field label={copy.eventEnd}>
            <TextInput name="endTime" type="time" />
          </Field>
          <Field label={copy.eventNotes}>
            <TextArea name="notes" rows={2} maxLength={2000} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClassName}>
              {copy.addEventSubmit}
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

function EventGroup({
  title,
  events,
  onRemoveEvent,
}: {
  title: string;
  events: readonly PlanningEvent[];
  onRemoveEvent: (eventId: string) => void;
}) {
  return (
    <section>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.emptyEvents}</p>
      ) : (
        <div className="mt-2">
          {events.map((event) => (
            <article key={event.id} className="border-b border-line/80 py-5">
              <h3 className="text-ink">{event.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">
                {event.date ? formatIsoDate(event.date) : "Date à préciser"}
                {event.startTime ? ` · ${event.startTime}` : ""}
                {event.endTime ? `–${event.endTime}` : ""}
              </p>
              <p className="mt-1 text-sm text-ink">
                {event.location.trim() ? event.location : copy.locationMissing}
              </p>
              {event.notes ? <p className="mt-2 text-sm text-ink-muted">{event.notes}</p> : null}
              <button
                type="button"
                className={`${quietButtonClassName} mt-2`}
                onClick={() => onRemoveEvent(event.id)}
              >
                {copy.deleteEvent} {event.title}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
