# ADR-006: Public RSVP invitation token

## Status
Accepted — 2026-09-25

## Context
Public RSVP is locked by ADR-005 at `/w/[slug]/rsvp` and `/w/[slug]/rsvp/confirmation`. Couple administration stays authenticated at `/app/weddings/[id]/guests/rsvp`. Guests have no Edenida account (ADR-003). The credential is the only thing that may authorize a public read or write.

`docs/SECURITY.md` and `docs/DATABASE.md` already require an opaque token, a stored hash, single-guest responses, and a unique `invitations.token_hash`. They do not choose the verifier, the owner of the credential, expiry, revocation, or replay. `docs/ARCHITECTURE.md` still allows "one guest (or household RSVP unit)".

Wave A Guests (branch `agent/edenida-guests-01/ede-guest-001-core`, not this change) hashes fixture tokens with unsalted SHA-256 so a mock UI can tell a live link from a bad one. That hasher and its proposal are explicitly not an approved design. This ADR replaces that proposal. Persistence must not copy the mock into Supabase.

Threats this decision is accountable for:

1. Guest-list enumeration through the public RSVP surface.
2. Online guessing and forged credentials.
3. A database or backup leak becoming a set of usable links.
4. A signing-key leak becoming the ability to mint a link for any guest.
5. One invitation revealing another guest, a household, or another wedding.
6. A revoked or expired link still applying an RSVP write.
7. Raw tokens in rows, member APIs, logs, or third-party requests.

Product behavior the credential must support, from the journeys and the Wave A domain (behavior, not code to adopt):

- A guest opens one link, accepts or declines, answers only the events they were invited to, and adds at most the plus-one the couple already allowed.
- The same person can correct an answer later, then see their own confirmation.
- The couple can revoke a link and issue a new one.
- The public page never shows the guest list.

## Decision
Use a **random opaque bearer token**. Store only **HMAC-SHA-256(pepper, domain-separated token)** on an **invitation** row. Each invitation authorizes **exactly one guest**.

The raw token is shown only when a member copies the link. It is never stored. The published slug is routing and a binding check. It is not authorization.

Unsalted SHA-256 and signed or JWT-style tokens are rejected. Reasons are in Alternatives. This is the production architecture. The Wave A hasher is not an implementation of it.

### Normative construction

| Rule | Value |
|---|---|
| Generator | CSPRNG (`crypto.randomBytes` or equivalent). No guest id, wedding id, slug, email, counter, or timestamp in the token. |
| Entropy | 256 bits (32 bytes). The 128-bit floor in `docs/SECURITY.md` stays a minimum. Production tokens are 256 bits. |
| Encoding | `v1_` + base64url(32 bytes), no padding. 46 characters. Alphabet `A–Z a–z 0–9 - _`. The prefix identifies the scheme. It is not a secret and not an authorization claim. HMAC covers the entire string, prefix included. |
| Verifier | `token_hash = HMAC-SHA-256(pepper, "invitation:" \|\| raw_token)`. Store the 32-byte digest (`bytea`). Unique. |
| Pepper | `RSVP_TOKEN_PEPPER`, 32 bytes from a CSPRNG, server environment only. Distinct from the Supabase service role, anon key, and any Auth JWT secret. Not in Postgres, not in the client bundle, not in fixtures. |
| Domain separation | Invitation digests use the `invitation:` label. A later browser session digest uses `session:` and a different random value. The two digests must not be interchangeable. |
| Lookup | Compute the HMAC for every syntactically valid token, then `WHERE token_hash = digest`. Do not look up by email, name, phone, guest id, or slug and then compare. |
| Comparison | The database equality on the digest is the match. If application code compares two digests, use a timing-safe compare on equal-length bytes. Do not compare raw tokens to a stored secret. There is no stored raw token. |
| Malformed input | Wrong prefix, length, or alphabet fails closed with the same public response as an unknown token, and still consumes the rate limit. |
| Hash site | The Next.js server (or another server runtime that holds the pepper) computes the HMAC. The database receives the digest only. Putting the pepper in SQL so a `SECURITY DEFINER` function can hash the raw token would put the pepper next to the digests and defeat the split. |

`pepper_id` is recorded on the row so operators know which secret produced the digest. Lookup does not send `pepper_id` in from the client. Rotation cannot rehash rows, because the raw token is not stored. Rotation procedure: deploy a new pepper, revoke every active invitation, couples issue new links. Keep the previous pepper only long enough to recognize old digests during that revocation job, not as a second public verifier.

### Token owner
The token belongs to the **invitation**, not to the guest row, the household, or the wedding.

The invitation row is bound to exactly one `guest_id` and that guest's `wedding_id`. At most one non-revoked invitation exists per guest. Presenting the token authorizes:

- read of the public RSVP view for that guest
- write of that guest's RSVP, inside the constraints below

It does not authorize household members, other guests, member APIs, or the rest of the published site.

Why not the guest row: issuance, expiry, revocation, regeneration, and `last_used_at` are properties of a credential. A guest can outlive several links. Overwriting a column on `guests` destroys that history and invites a raw-token column "for convenience".

Why not the household: a household link is a guest-list disclosure. It would return other people's names and let one bearer RSVP for them. Households remain a couple-side grouping (`docs/DATABASE.md`). Children and partners who must answer are their own guests with their own invitations. `docs/ARCHITECTURE.md`'s "or household RSVP unit" is closed by this ADR.

Why not the wedding: a wedding-level link is the full guest list.

### Revocation and regeneration
- `revoked_at` set means the link is dead, including for confirmation re-reads and for in-flight submits.
- Regeneration inserts a new invitation and sets `revoked_at` plus `revoked_reason = regenerated` on every other non-revoked invitation for that guest, in the same operation.
- The couple can revoke without issuing a replacement (`revoked_reason = couple`).
- Deleting the guest or the wedding removes or revokes its invitations in the same operation.
- Pepper rotation uses `revoked_reason = pepper_rotation`.
- There is no "show the token again" API. A lost link is a new invitation. Member reads return status, `issued_at`, `expires_at`, and `revoked_at` only. They never return `token_hash` or the raw token.
- The raw token is returned once, in the issuance response that renders the copy-link control, over the authenticated member session.

### Expiry
`expires_at` is required. No open-ended invitation.

| Situation | `expires_at` |
|---|---|
| Wedding date is null | `issued_at` + 400 days |
| Wedding date is set and still in the future | earlier of `issued_at` + 400 days and `wedding_date` + 30 days |
| Wedding date is already past at issuance | `issued_at` + 30 days |

The couple may set an earlier `expires_at`. They may not set a later one than the table. Moving the wedding date does not extend existing links. Compare in UTC in the database. Expired, revoked, unknown, malformed, and wrong-wedding presentations share one public outcome (below). Member UI may show expired versus revoked, because that view is authenticated.

### Replay
The invitation token is a **bearer credential with server-side state**, not a single-use nonce and not a self-contained ticket.

A valid token may GET and POST more than once until it expires, is revoked, or the couple locks RSVP. Each successful public submit **updates** that guest's current RSVP. It does not create another guest and does not append a second current RSVP. Last write wins. Repeating the same payload is success.

A valid token may load confirmation and the form prefilled with **that guest's** current answer, including after accept or decline, so they can correct it.

These are not successful replays:

- revoked, expired, malformed, unknown, or wrong-wedding token (no write)
- a body that names another guest, another invitation, or another wedding (ignore those fields; the invitation binding wins)
- a submit after `rsvp_locked_at` is set on the wedding

`rsvp_locked_at` (future column on the wedding or its settings) is couple-controlled. The holder of a still-valid token may be told that RSVP is closed. Everyone else still receives the uniform invalid-link response. Closing RSVP does not delete stored answers.

Decline clears attending events and plus-one attendance on the public write. It must not modify couple-only fields (`private_notes`, email, phone, household, side, invite list, `plus_one_allowed`).

### URL
Distribution and re-entry URL:

```text
/w/[slug]/rsvp?t=<token>
/w/[slug]/rsvp/confirmation?t=<token>
```

Rules:

1. Resolve the invitation by token digest globally. Then load that guest and that wedding. Do not query guests by slug.
2. The slug must equal that wedding's `wedding_sites.slug`. Any other slug, including another real wedding, fails closed.
3. Do not redirect a bearer to the "correct" slug. A redirect would confirm that the token is live and would reveal which wedding it belongs to.
4. Unpublished or unknown slugs use the same invalid-link response. A draft site does not become readable because a token was attached.
5. `is_private` on the marketing site does not replace this check. The token gates only the RSVP resource for its guest. It does not unlock the rest of `/w/[slug]`, member routes, or private files.
6. Missing `t` is the same invalid-link response. There is no name or email search on this route.

Query secrets leak through Referer, caches, browser history, and request logs. Production responses on these routes therefore send:

- `Referrer-Policy: no-referrer`
- `Cache-Control: private, no-store`
- `X-Robots-Tag: noindex`

The RSVP routes load no third-party scripts, fonts, or analytics. Access logs must drop the `t` query parameter. The platform configuration that does so is part of shipping this design, not a follow-up wish.

Before production traffic, a successful verify also issues a **separate** browser session and redirects (303) to the same path without `t`:

- Cookie value: new 256-bit CSPRNG, not the invitation token.
- Store `HMAC-SHA-256(pepper, "session:" \|\| cookie_value)` only.
- Flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path` limited to that wedding's `/w/[slug]/rsvp`.
- Lifetime: at most 12 hours, and never past the invitation `expires_at`. Revoking the invitation revokes its sessions.
- POST requires the cookie (after the exchange) and an `Origin` allowlist match for this application. `SameSite=Lax` is not the only CSRF control once a cookie exists.
- The long-lived email link still uses `?t=` so a later visit can mint a new session. The invitation token itself is never placed in a cookie.

### Public data
A valid token may return only:

- wedding title
- that guest's first name
- whether a plus-one is allowed
- the events that guest is invited to (id, name, display time)
- that guest's own current RSVP fields needed to edit or confirm

It must not return last name, email, phone, address, private notes, household members, other guests, other invitations, seat assignments, token digest, guest id, wedding id, or aggregate counts. Event ids outside that guest's invite list are omitted. Field validation errors are allowed only after the token has already been accepted; they must not echo other guests or other events.

Unknown, malformed, expired, revoked, and wrong-wedding requests return **one** response: HTTP 404, the same body, no form, no Cache headers that differ. Do not use 401 versus 410 versus 404 as an oracle. Rate-limit responses are HTTP 429 with a generic body that also does not say whether the token exists.

Accepted, declined, and already submitted are states of a **valid** token. Show that guest's own answer and allow an update until expiry, revocation, or RSVP lock.

### Multiple events
Event ids are not claims inside the token. The server loads the invite list for the bound guest and drops or rejects any submitted event id outside that list. A decline stores no attending events. The token cannot add the guest to an event.

### Plus-one
`plus_one_allowed` is couple-controlled on the guest. The public client cannot turn it on. When it is off, a plus-one name or attendance flag is a validation error on an otherwise valid token. When the guest declines, a plus-one cannot attend. At most one plus-one is accepted. The public form does not create a guest row, does not issue a second token, and does not attach the plus-one to the household. A later product decision may materialize a plus-one as a guest for seating; that person gets a new invitation of their own if they need a link. This token never covers them.

### Rate limiting
Apply limits on resolve and submit. Use more than one key. Exceeding a limit returns the generic 429 and does not reveal whether a digest matched. Prefer an edge limiter with a short TTL. Do not retain raw IPs in Postgres.

| Key | Limit | Window |
|---|---|---|
| Client IP | 30 requests | 10 minutes |
| Client IP | 100 requests | 24 hours |
| Invitation digest (only after the token is syntactically valid) | 10 misses | 1 hour |
| Invitation id, after a match | 20 submits | 1 hour |

Shared NATs will trip the IP caps before they trip a 256-bit secret. Throttle. Do not permanently revoke a valid invitation because of failed attempts. Anonymous callers have no other public guest endpoint. Direct `anon` SQL access to guest, invitation, and RSVP tables stays denied (ADR-003).

### Logging and audit
Log and store `invitation_id`, `wedding_id`, `guest_id`, outcome, and timestamp. Outcomes include `invalid`, `expired`, `revoked`, `slug_mismatch`, `locked`, `rate_limited`, `validation_error`, and `success`. Failed guesses store no digest, no prefix, and no raw token.

Never log the raw token, the `t` parameter, the `Referer` header, the digest, the pepper, allergies, dietary text, the plus-one name, or the full guest record.

Audit events for members: invitation issued, regenerated, revoked; RSVP submitted (source `guest` or `couple`). The activity entry identifies the guest and the invitation. It does not copy health-adjacent free text that already lives on the RSVP row.

### Privacy
The raw token exists in the guest's inbox and in the couple's copy action. Edenida does not keep a copy. Digests are not reversible. Erasing a guest deletes their invitations, sessions, and RSVPs.

Dietary fields and allergies are health-adjacent. They are collected for catering, returned only to that guest's token and to wedding members, and kept out of logs.

IP addresses used for rate limits are personal data. Keep them in the limiter's short TTL store only. Do not use the token as an analytics id. Do not send RSVP URLs to third parties.

The couple is the context in which guest data is entered. This ADR does not change that. It limits what the public credential can expose and forbids retaining the credential itself.

## Alternatives considered

### 1. Random opaque token + unsalted SHA-256
Rejected.

A 256-bit CSPRNG token makes an offline preimage of SHA-256 impractical. That is not sufficient for this system. The verifier and the bearer would both live in operational copies of the database (backups, replicas, dumps, support exports). Anyone with that copy can present `token_hash` lookups only if they also have the preimage — unsalted SHA-256 does not reveal the preimage — so a digest-only leak is not immediately a usable link **as long as entropy never drops**. The failure mode we refuse is the next entropy mistake: a shorter token, a timestamp, a fixture prefix, a reused staging token, or a logged raw token that is later hashed with a public algorithm and checked offline at SHA-256 speed.

The Wave A mock is this construction, including a public `edn_fix_` prefix on fixtures. Selecting it would adopt unreviewed code because it already exists. HMAC with a per-environment pepper makes a stolen `invitations` table useless without the pepper, and it makes staging hashes useless against production. The lookup stays a unique index. Cost is one server secret, not a new storage model.

A password KDF (Argon2id, bcrypt, scrypt) is the wrong repair. Those functions are for low-entropy passwords. They are deliberately slow, they use a random salt, and they cannot be the key of a unique index without storing a second lookup value. A slow public endpoint is also a denial-of-service lever. High-entropy bearer secrets use a keyed fast digest.

### 2. HMAC-backed opaque token
**Selected.** Described under Decision.

The token stays opaque and random. The stored value is a keyed digest. Revocation, expiry, plus-one policy, and the event list stay in rows the server reads after the digest matches, so they cannot go stale inside the credential. Pepper disclosure alone does not mint a working link: the attacker can HMAC arbitrary strings, and those digests are not in the table unless they can also insert rows. Database disclosure alone does not mint a working link: the attacker has digests and no pepper and no raw token. Both together are a full compromise, which is the same bar as any other server-secret-plus-database failure, and it is a worse bar to clear than a JWT signing key by itself.

### 3. Signed or JWT-style token
Rejected.

A signed token (JWT or an equivalent `payload.signature` blob) was the main alternative that avoids storing a secret digest. It loses on the threats that matter here.

- **Revocation and regeneration need state.** A denylist, `jti`, or token version is an invitation row under another name. Edenida would still need the table, plus a signing-key lifecycle.
- **Key compromise forges guests.** Possession of the signing key lets an attacker sign a token for any guest id, including guests who were never issued a link, until the key is rotated and every verifier rejects the old key. Possession of the HMAC pepper does not, unless the attacker can also write `token_hash`.
- **Claims leak.** A JWT payload is only base64. Guest ids, wedding ids, and expiry would sit in email, browser history, and logs. That fights the minimum-data rule. Encrypting the payload (JWE) adds a second key and still needs the database for revocation.
- **Embedded authorization goes stale.** Plus-one permission and the event list change after the link is sent. The server must re-read them. A token that carries them will drift from the couple's settings.
- **Known signing hazards.** Algorithm confusion, `none`, and key mix-ups are implementation footguns this product does not need. RSVP is not a cross-service identity protocol. Supabase Auth JWTs stay on the member session. They are not reused as guest credentials.
- **Replay is not solved by `exp`.** Corrections and confirmation re-reads are required. `exp` without a revocation row cannot kill a leaked link the same day.

Stateless verification is not a benefit once every accept path must hit Postgres for the guest, the invite list, and the current RSVP.

## Database implications
No migration ships with this ADR. Future persistence needs the following. Names are conceptual.

### `invitations`
Owns the credential.

| Column | Notes |
|---|---|
| `id` | UUID primary key |
| `wedding_id` | Tenant key. Required for RLS and for the slug binding check |
| `guest_id` | Exactly one guest. No `household_id` |
| `token_hash` | 32-byte HMAC digest. Unique. Not selectable by member clients |
| `pepper_id` | Small integer, default 1. Not supplied by the client |
| `issued_at` | Required |
| `expires_at` | Required. Rules above |
| `revoked_at` | Null while active |
| `revoked_reason` | `regenerated`, `couple`, `guest_deleted`, `pepper_rotation` |
| `last_used_at` | Set on successful resolve or submit. Not set on failed guesses |
| `created_by` | Member user id, null for a system job |
| `replaced_by_invitation_id` | Set on the revoked row when regenerated |
| `created_at` | Required |

Partial uniqueness: one row per `guest_id` with `revoked_at` null.

No raw-token column. No hash of a hash "for display".

### `rsvp_sessions`
Required before production, for the cookie exchange.

| Column | Notes |
|---|---|
| `id` | UUID |
| `invitation_id` | Parent credential |
| `session_hash` | 32-byte HMAC under the `session:` label. Unique |
| `expires_at` | At most 12 hours and not after the invitation expiry |
| `revoked_at` | Set when the invitation is revoked or the session is replaced |
| `created_at`, `last_seen_at` | Operational |

No raw cookie value.

### RSVP rows
The current answer stays one row per guest (plus per-event answers for events that guest was invited to). `invitation_id` records which credential last wrote a guest-sourced submit; a couple-sourced edit may leave it null. Public writes update that row. They do not insert a second current RSVP on replay.

### Attempt metadata
Do not add a durable table of failed tokens. Counters live in the rate limiter with a short TTL. If a future abuse review needs a forensic table, it may store truncated time, outcome, and a hashed IP. It must not store token material or a digest prefix.

### `rsvp_locked_at`
One timestamp on the wedding or wedding settings. Null means guests with a live invitation may still update.

### RLS (when the migration exists)
RLS on for every new table. No `anon` privileges on guests, invitations, sessions, or RSVPs. Public reads and writes go through server code that already checked the digest, then a narrow query by primary key. `service_role` stays on the server. Member policies may read invitation status columns and must not expose `token_hash` or `session_hash` to the browser. A database view without those columns is the member read path.

## Security tests required later
These tests are a gate for the persistence slice. They do not exist yet, and this ADR does not add them.

| Case | Required result |
|---|---|
| Valid token | Returns only the public field set for that guest. Submit updates that guest. Couple dashboard sees the new status. |
| Invalid token | Uniform 404. No write. Same body as the other failures in this table. |
| Malformed or forged token | Random 256-bit value, flipped character, unsalted SHA-256 hex, JWT pasted into `t`, token that embeds a guest UUID: uniform 404. No row is created. |
| Expired | Uniform 404. No write. Member UI may still show expired. |
| Revoked | Uniform 404. A submit raced after revocation does not change the RSVP. |
| Wrong wedding | Live token presented on another wedding's slug, or on a slug that is not the bound wedding: uniform 404. No redirect to the real slug. No data from either wedding beyond that body. |
| Other invitation | Token A cannot read or write the guest, events, or RSVP of token B, including two guests in the same household. |
| Enumeration | No name, email, or guest-id lookup. Responses for unknown tokens match each other. Public JSON contains no second guest, no household roster, no digest, no private note. `anon` SELECT on guest tables is denied. |
| Anonymous limits | Missing token is the uniform 404. IP and miss limits return a generic 429 without confirming a match. A valid invitation is not revoked solely by misses. |
| Replay / update | Second submit changes the same RSVP in place. Identical resubmit succeeds. Confirmation GET after accept or decline shows only that guest. After revoke, the same body is a 404. After RSVP lock, a valid token does not write. |
| Plus-one | `plus_one_allowed = false` rejects a plus-one name or attendance flag. Decline cannot record a plus-one. The submit does not insert a guest and does not issue a token. |
| Events | An event id the guest was not invited to is rejected or dropped. Other events are not listed. |
| Regeneration | New link works. Previous raw token gets the uniform 404. Only one non-revoked invitation remains. |
| Leakage | Issuance response is the only member response that contains the raw token. Later member GET does not. Logs and test captures of public requests do not contain `t`, the digest, or the pepper. Public and member payloads do not contain `token_hash`. |
| Cookie session, when built | Cookie is not the invitation token. Session dies when the invitation is revoked. POST from a foreign `Origin` is rejected. |
| Slug authority | A matching digest with a mismatched slug does not authorize. A matching slug with a bad token does not authorize. |

## Consequences
+ A stolen invitation table is not a set of RSVP links.
+ A stolen pepper is not the ability to sign in as an arbitrary guest.
+ Revocation, regeneration, expiry, and RSVP corrections are ordinary row updates.
+ The public surface stays one guest wide, which matches UJ-03 and the enumeration threat in `docs/SECURITY.md`.
+ Wave A must replace `hashInvitationToken` (unsalted SHA-256) and the `edn_fix_` fixtures. Those strings are not this design.
− Every environment needs `RSVP_TOKEN_PEPPER`. Missing pepper fails closed (no fallback hash).
− Pepper rotation invalidates outstanding links. That is accepted.
− The cookie exchange and log redaction are mandatory before production, so the first persistence slice cannot stop at "compare a hash and render `?t=`".
− Household-level RSVP links are out of scope. A future product change needs a new ADR.
− This decision does not add tables, RLS, routes, or application code.

## Related
- ADR-003 — guests authenticate with invitation tokens, not user accounts
- ADR-004 — public host path is `/w/{slug}`
- ADR-005 — public RSVP versus `/app/weddings/[id]/guests/rsvp`
- `docs/SECURITY.md` — RSVP threat and the 128-bit floor this ADR raises to 256 bits for issuance
- `docs/DATABASE.md` — `invitations` logical model; column set above supersedes the shorter sketch when the migration is written
