# RSVP token security — proposal for review

**Status: PROPOSAL. Not approved.**
**Author:** EDENIDA-GUESTS-01 (EDE-GUEST-001, Wave A)
**Reviewers:** Coordinator, Security
**Do not treat this file as the definitive token design.** No migration, RPC, or production issuer should ship from this document until those reviewers accept or replace it.

Wave A implements the guest and RSVP UX against a mock repository. The mock hashes fixture tokens with SHA-256 only so the UI can tell an active link from a bad one. That hasher is explicitly a stand-in (`src/features/guests/data/token-hash.ts`).

## What this proposal is trying to protect

- Guest-list enumeration through the public RSVP surface
- Token guessing and replay
- One invitation revealing any other guest
- Raw tokens at rest, in logs, or in member UI

## Recommended shape (open to replacement)

1. Generate the raw token with a CSPRNG. Length at least 128 bits, encoded so it is URL-safe. Do not embed the guest id, wedding id, or a guessable counter.
2. Store only a hash on `invitations.token_hash` (unique). Show the raw token once, when the couple copies the link.
3. Resolve a submission by hashing the presented token and looking up that hash. Compare with a constant-time function. Do not look guests up by email or name on the public route.
4. Scope the result to a single guest. The public payload in this wave already follows that: first name, that guest's events, plus-one policy, and their own previous answer. No household members, no emails, no private notes, no token hash.
5. Expired, revoked, unknown, and wrong-slug tokens return **one** public message. The mock does this (`PUBLIC_LINK_MESSAGE`). Distinguishing "expired" from "unknown" is an account oracle; do not do it in the UI.
6. Revoke the previous invitation row when a new link is issued. Honor `expires_at` and `revoked_at`.
7. Rate-limit the public submit path by IP and by token hash. Starting point for discussion only, not a chosen control: a small per-token hourly budget and a larger per-IP budget, with the same public error when the limit trips. Security should set the real numbers.
8. Validate the body with Zod and the same plus-one / event constraints the mock enforces server-side. Ignore client claims that a plus-one is allowed.
9. The public page should send `Referrer-Policy: no-referrer` and `noindex`. This wave sets both via page metadata. A query-string token can still leak via the browser history and copies; that is one reason the placement of the token is an open question below.
10. Log outcome and invitation id, never the raw token, never the full guest record.

## Open questions — do not decide in this track

| Topic | Why it is open | Notes from the current docs |
|---|---|---|
| Hash algorithm | SHA-256 of a high-entropy token vs HMAC-SHA-256 with a server pepper | `SECURITY.md` says store a hash. It does not choose peppering. The mock uses unsalted SHA-256 and must not be copied into production just because it exists. |
| Who the token names | One guest vs one household | `SECURITY.md` says single-guest scope. `ARCHITECTURE.md` allows "one guest (or household RSVP unit)". This UI is single-guest. A household mode would change the form and the enumeration story. |
| Where the secret sits | Query (`?t=`), path segment, or a one-time code exchanged for an HttpOnly cookie | `USER-JOURNEYS.md` shows `/w/{slug}/rsvp?t=…`. Query tokens leak via Referer if that policy is dropped. Reviewers should confirm the journey or replace it. |
| Error uniformity | One message vs a distinct "expired, ask for a new link" | This proposal prefers one message. Product may want a kinder expired state; that needs an explicit security exception. |
| Rate limits | Actual thresholds, storage (edge vs Postgres), and penalty | Not chosen. |
| Confirmation re-read | Same token may load the confirmation page | The mock allows it, still scoped to that guest. Confirm this is acceptable. |
| Plus-one identity | Same token speaks for the plus-one | The form collects a plus-one name and meal on the invited guest's token. It does **not** create a second guest or a second token. Materializing a guest row is a product decision in the persistence handoff. |
| CSRF | Public POST is authorized by the token, not by the couple's session cookie | Still worth an Origin check on browser submits so a random site cannot silently post a token it does not know. Reviewers should say if that is required for v1. |

## Explicitly out of scope for Wave A

- Migrations and RLS
- A production token issuer or copy-link button (the editor shows link **status** only: active, expired, revoked)
- Rate-limit infrastructure
- Seating side effects

## Tests already guarding the mock

- Unknown, expired, revoked, and wrong slug share one message
- Public JSON has no other guest names, no private notes, no raw token, no hash
- A guest without `plusOne.allowed` cannot submit a plus-one
- Member list/detail responses do not include the raw fixture token

## Acceptance this proposal asks of reviewers

Reply with one of: accept, accept with listed changes, or replace. Until that reply, the Supabase track must not treat `token-hash.ts` or the fixture prefix `edn_fix_` as the production scheme.
