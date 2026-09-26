import Link from "next/link";

import { isNavItemActive, type WorkspaceNavItem } from "../domain/nav";
import { focusRing } from "./classes";

export function WorkspaceNavList({
  items,
  pathname,
}: {
  items: readonly WorkspaceNavItem[];
  pathname: string;
}) {
  return (
    <nav aria-label="Espace mariage" className="max-w-full">
      <ul className="flex max-w-full gap-1 overflow-x-auto px-2 py-2 md:flex-col md:overflow-visible md:px-3 md:py-4">
        {items.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <li key={item.id} className="shrink-0 md:shrink">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-3 text-sm transition md:whitespace-normal ${focusRing} ${
                  active
                    ? "bg-bg-elevated text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
