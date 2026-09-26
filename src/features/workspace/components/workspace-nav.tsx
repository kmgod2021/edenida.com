"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { workspaceNavItems } from "../domain/nav";
import { quietLinkClass } from "./classes";
import { WorkspaceNavList } from "./workspace-nav-list";

export function WorkspaceNav({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-line md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <WorkspaceNavList
        items={workspaceNavItems(weddingId)}
        pathname={pathname}
      />
      <div className="flex gap-4 overflow-x-auto px-4 pb-3 md:flex-col md:px-6 md:pb-6">
        <Link href="/app" className={`${quietLinkClass} whitespace-nowrap`}>
          Tous les mariages
        </Link>
      </div>
    </div>
  );
}
