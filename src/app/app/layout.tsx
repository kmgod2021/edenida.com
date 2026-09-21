import { connection } from "next/server";
import type { ReactNode } from "react";

export const metadata = {
  title: "Espace",
};

export default async function AppWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
