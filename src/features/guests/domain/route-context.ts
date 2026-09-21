export const GUEST_SCENARIOS = ["demo", "empty", "error"] as const;
export type GuestScenario = (typeof GUEST_SCENARIOS)[number];

export type RouteContext = {
  sessionId: string;
  scenario: GuestScenario;
};

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Test seam. Production data access must ignore session and scenario. */
export function parseRouteContext(
  searchParams: Record<string, string | string[] | undefined>,
): RouteContext {
  const sessionRaw = firstParam(searchParams.session);
  const scenarioRaw = firstParam(searchParams.scenario);
  const sessionId =
    sessionRaw && SESSION_PATTERN.test(sessionRaw) ? sessionRaw : "default";
  const scenario =
    scenarioRaw === "empty" || scenarioRaw === "error" ? scenarioRaw : "demo";
  return { sessionId, scenario };
}

export function routeQuery(
  ctx: RouteContext,
  extra?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (ctx.sessionId !== "default") params.set("session", ctx.sessionId);
  if (ctx.scenario !== "demo") params.set("scenario", ctx.scenario);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function guestPaths(weddingId: string, ctx: RouteContext) {
  const query = (extra?: Record<string, string | undefined>) => routeQuery(ctx, extra);
  const base = `/app/weddings/${weddingId}`;
  return {
    list: (extra?: Record<string, string | undefined>) =>
      `${base}/guests${query(extra)}`,
    create: () => `${base}/guests/new${query()}`,
    guest: (guestId: string) => `${base}/guests/${guestId}${query()}`,
    households: (extra?: Record<string, string | undefined>) =>
      `${base}/households${query(extra)}`,
    rsvp: () => `${base}/rsvp${query()}`,
  };
}

export function publicRsvpPath(
  slug: string,
  ctx: RouteContext,
  token: string,
  confirmation = false,
) {
  const params = new URLSearchParams();
  params.set("t", token);
  if (ctx.sessionId !== "default") params.set("session", ctx.sessionId);
  if (ctx.scenario !== "demo") params.set("scenario", ctx.scenario);
  const suffix = confirmation ? "/confirmation" : "";
  return `/w/${slug}/rsvp${suffix}?${params.toString()}`;
}

const NOTICES = {
  "guest-saved": "Invité enregistré.",
  "guest-removed": "Invité retiré de la liste.",
  "household-saved": "Foyer enregistré.",
} as const;

export type GuestNotice = keyof typeof NOTICES;

export function noticeMessage(value: string | undefined) {
  if (!value) return null;
  return value in NOTICES ? NOTICES[value as GuestNotice] : null;
}
