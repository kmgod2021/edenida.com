import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { FIXTURE_PRIVATE_NOTE } from "@/features/guests/data/fixture-tokens";
import { GuestListScreen } from "@/features/guests/ui/guest-list-screen";
import { PublicRsvpForm } from "@/features/guests/ui/public-rsvp-form";
import { RsvpConfirmationView } from "@/features/guests/ui/rsvp-confirmation";
import { RsvpDashboardScreen } from "@/features/guests/ui/rsvp-dashboard-screen";
import { EmptyState, ErrorState } from "@/features/guests/ui/states";
import type { GuestListItem, PublicRsvpView, RsvpDashboard, WeddingGuestScope } from "@/features/guests/domain/types";

const wedding: WeddingGuestScope = {
  id: "wed-demo",
  title: "Camille & Julien",
  slug: "camille-et-julien",
  partnerAName: "Camille",
  partnerBName: "Julien",
  events: [{ id: "evt-ceremony", name: "Cérémonie", startsAt: null }],
};

const ctx = { sessionId: "test", scenario: "demo" as const };

const lea: GuestListItem = {
  id: "gst-lea",
  firstName: "Léa",
  lastName: "Martin",
  email: "lea.martin@example.com",
  groupLabel: "Famille",
  householdId: "hh-martin",
  householdName: "Famille Martin",
  side: "partner_a",
  isChild: false,
  plusOne: { allowed: true, name: null, guestId: null },
  invitationStatus: "invited",
  rsvpStatus: "pending",
  mealChoice: "unset",
  dietary: [],
  eventIds: ["evt-ceremony"],
};

describe("guest views", () => {
  it("renders the guest list with a search label and the guest name", () => {
    const html = renderToStaticMarkup(
      <GuestListScreen wedding={wedding} guests={[lea]} households={[]} ctx={ctx} />,
    );
    expect(html).toContain("Invités");
    expect(html).toContain("Léa Martin");
    expect(html).toContain("Rechercher");
    expect(html).not.toContain(FIXTURE_PRIVATE_NOTE);
  });

  it("renders empty and error states with a next step or alert", () => {
    const empty = renderToStaticMarkup(
      <EmptyState title="Aucun invité pour l'instant" body="Ajoutez une première personne." />,
    );
    expect(empty).toContain("Aucun invité");

    const error = renderToStaticMarkup(
      <ErrorState
        title="Impossible de charger les invités"
        body="Les invités sont temporairement indisponibles."
      />,
    );
    expect(error).toContain("role=\"alert\"");
    expect(error).not.toContain("Léa");
  });

  it("renders dashboard counts", () => {
    const dashboard: RsvpDashboard = {
      invited: 6,
      attending: 3,
      declined: 1,
      awaiting: 2,
      notInvited: 1,
      plusOnesAllowed: 2,
      plusOnesAttending: 0,
      meals: [{ choice: "fish", count: 1 }],
      dietary: [],
      events: [
        { eventId: "evt-ceremony", name: "Cérémonie", attending: 3, declined: 1, pending: 1 },
      ],
      recent: [],
    };
    const html = renderToStaticMarkup(
      <RsvpDashboardScreen wedding={wedding} dashboard={dashboard} ctx={ctx} />,
    );
    expect(html).toContain("Présents");
    expect(html).toContain(">3<");
    expect(html).toContain("Aucune réponse");
  });

  it("renders a single-guest RSVP form and confirmation", () => {
    const view: PublicRsvpView = {
      weddingTitle: wedding.title,
      guestFirstName: "Léa",
      plusOneAllowed: true,
      events: [{ id: "evt-ceremony", name: "Cérémonie", whenLabel: null }],
      defaults: {
        status: "",
        attendingEventIds: [],
        plusOneAttending: false,
        plusOneName: "",
        plusOneMealChoice: "unset",
        mealChoice: "unset",
        dietary: [],
        dietaryNote: "",
        allergies: "",
        message: "",
      },
    };
    const form = renderToStaticMarkup(
      <PublicRsvpForm slug={wedding.slug} token="edn_fix_hidden" view={view} ctx={ctx} />,
    );
    expect(form).toContain("Bonjour Léa");
    expect(form).toContain("Je serai là");
    expect(form).not.toContain("Awa");
    expect(form).not.toContain(FIXTURE_PRIVATE_NOTE);

    const confirmation = renderToStaticMarkup(
      <RsvpConfirmationView
        slug={wedding.slug}
        token="edn_fix_hidden"
        ctx={ctx}
        weddingTitle={wedding.title}
        guestFirstName="Léa"
        confirmation={{
          weddingTitle: wedding.title,
          guestFirstName: "Léa",
          status: "attending",
          plusOneName: null,
          plusOneMealChoice: "unset",
          mealChoice: "fish",
          dietary: ["gluten_free"],
          eventsAttending: [{ id: "evt-ceremony", name: "Cérémonie" }],
          message: null,
        }}
      />,
    );
    expect(confirmation).toContain("Merci, Léa");
    expect(confirmation).toContain("Poisson");
    expect(confirmation).toContain("Sans gluten");
    expect(confirmation).toContain("Modifier ma r");
    expect(confirmation).toContain("href=\"/w/camille-et-julien/rsvp?t=edn_fix_hidden&amp;session=test\"");
    expect(confirmation).not.toContain(">edn_fix_hidden<");
  });
});
