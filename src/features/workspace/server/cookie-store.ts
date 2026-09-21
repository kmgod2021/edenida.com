import { connection } from "next/server";
import { cookies } from "next/headers";

import {
  MAX_WORKSPACE_COOKIE_LENGTH,
  parseWorkspaceState,
  serializeWorkspaceState,
  type WorkspaceFixtureState,
} from "../data/state";

export const WORKSPACE_FIXTURE_COOKIE = "edenida_workspace";

export class WorkspaceFixtureTooLargeError extends Error {
  constructor() {
    super("WORKSPACE_FIXTURE_TOO_LARGE");
    this.name = "WorkspaceFixtureTooLargeError";
  }
}

export async function readWorkspaceState(): Promise<WorkspaceFixtureState> {
  await connection();
  const jar = await cookies();
  return parseWorkspaceState(jar.get(WORKSPACE_FIXTURE_COOKIE)?.value);
}

export async function writeWorkspaceState(
  state: WorkspaceFixtureState,
): Promise<void> {
  const raw = serializeWorkspaceState(state);
  if (raw.length > MAX_WORKSPACE_COOKIE_LENGTH) {
    throw new WorkspaceFixtureTooLargeError();
  }
  const jar = await cookies();
  jar.set(WORKSPACE_FIXTURE_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
