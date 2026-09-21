import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Stand-in hasher for the Wave A mock repository.
 * Not an approved production design. See docs/rsvp-token-security-proposal.md.
 */
export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokenHashesEqual(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
