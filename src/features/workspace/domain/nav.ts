export type WorkspaceNavItem = {
  id:
    | "dashboard"
    | "website"
    | "guests"
    | "planning"
    | "budget"
    | "vendors"
    | "settings";
  href: string;
  label: string;
  match: "exact" | "prefix";
};

/** P0 shell only. Seating, notes, files, and inspiration stay out (Phase 8/9). */
export function workspaceNavItems(weddingId: string): WorkspaceNavItem[] {
  const base = `/app/weddings/${weddingId}`;
  return [
    { id: "dashboard", href: base, label: "Tableau de bord", match: "exact" },
    { id: "website", href: `${base}/website`, label: "Site web", match: "prefix" },
    { id: "guests", href: `${base}/guests`, label: "Invités", match: "prefix" },
    {
      id: "planning",
      href: `${base}/planning`,
      label: "Planning",
      match: "prefix",
    },
    { id: "budget", href: `${base}/budget`, label: "Budget", match: "prefix" },
    {
      id: "vendors",
      href: `${base}/vendors`,
      label: "Prestataires",
      match: "prefix",
    },
    {
      id: "settings",
      href: `${base}/settings`,
      label: "Réglages",
      match: "prefix",
    },
  ];
}

export function isNavItemActive(item: WorkspaceNavItem, pathname: string): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
