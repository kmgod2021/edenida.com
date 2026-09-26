import { connection } from "next/server";
import type { ReactNode } from "react";

import { requireWorkspaceUser } from "@/features/workspace/server/session";

export const metadata = {
  title: "Espace",
};

export default async function AppWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  await requireWorkspaceUser();
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
