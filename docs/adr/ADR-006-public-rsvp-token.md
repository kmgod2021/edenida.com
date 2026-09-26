# ADR-006: Public RSVP invitation token

## Status
Accepted — 2026-09-25. Revised 2026-09-26 (EDE-SEC-RSVP-001-R4). The token design is unchanged. The privileged functions no longer sit in the exposed schema.

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
| Pepper | Vault secret `rsvp_token_pepper`, 32 bytes from a CSPRNG. Not an application env var. Not in Vercel. Not in the client bundle. Not in `public`. |
| Domain separation | Invitation digests use the `invitation:` label. Session digests use `session:`. Throttle counters use `throttle:`. The three digests must not be interchangeable, and only the first two are stored as credentials. |
| Lookup | The caller sends the raw invitation token or the raw session secret. `rsvp_internal` recomputes the HMAC and matches `token_hash` or `session_hash`. Do not look up by email, name, phone, guest id, or slug. |
| Comparison | Equality on the `bytea` digest inside the helper. The raw secret is not stored, so nothing in the application compares a raw token to a column. The index lookup is not constant-time. The uniform result and the in-function throttle are the controls. |
| Malformed input | Wrong prefix, length, or alphabet fails closed with the same public result as an unknown token, and still consumes the throttle. |
| Hash site | Postgres. `rsvp_internal` calls `extensions.hmac` with `search_path = ''`. The pepper comes only from `rsvp_internal.rsvp_token_pepper()`, which takes no arguments. `pgcrypto` already lives in `extensions` (`supabase/migrations/20260920010000_foundation.sql`). |

`pepper_id` is recorded on the row so operators know which Vault secret produced the digest. The caller does not send `pepper_id`. Rotation cannot rehash rows, because the raw token is not stored. Rotation procedure: write the new Vault secret, revoke every active invitation, couples issue new links. The previous secret is not a second public verifier.

### Invariants

```text
Does RSVP use service_role?                          NO
Can token_hash authenticate?                         NO
Can session_hash authenticate?                       NO
Who computes the HMAC?                               rsvp_internal, via extensions.hmac
Where is the pepper stored?                         Supabase Vault secret rsvp_token_pepper
Who may read that secret?                           rsvp_internal.rsvp_token_pepper() only
What is the public RPC entrypoint?                  public.exchange_rsvp_session,
                                                     public.read_rsvp,
                                                     public.submit_rsvp
Public RPC mode?                                    SECURITY INVOKER, no table access
How does member issue/revoke authorize?             user JWT + private.can_edit_wedding
Can anon query the tables directly?                 NO
What stops distinct-token guessing?                 256-bit entropy, not an IP limiter
```

```text
Edenida RSVP application code does not use service_role.
Edenida RSVP application code does not use SUPABASE_SECRET_KEY.
No Vercel environment contains an RSVP database-bypass credential.
```

```text
Public RSVP MUST NOT require SUPABASE_SECRET_KEY.
Public RSVP MUST NOT require service_role.
Member invitation issue, revoke, and regenerate MUST NOT require service_role.
```

A stolen `invitations` or `rsvp_sessions` table is not a set of working credentials. Public entrypoints accept the raw invitation token or the raw session secret only. They do not accept `token_hash`, `session_hash`, or any other stored digest.

## Database access boundary

This is the authorization model for the token above. It replaces any design that queries by digest with `service_role`, and it replaces exposed `SECURITY DEFINER` RPCs.

### Data API facts in this repository

Verified against the current foundation, not against a generic Supabase sketch:

- `supabase/config.toml` sets `[api] schemas = ["public", "graphql_public"]`. PostgREST exposes tables, views, and functions in those schemas only. `supabase.rpc(...)` resolves a function in an exposed schema. A function in any other schema is not a Data API RPC, even if some role has `EXECUTE`.
- `extra_search_path = ["public", "extensions"]`. Request `search_path` does not include `private`, `vault`, or `rsvp_internal`. Do not add `rsvp_internal` there.
- `private` is not an API schema. `supabase/migrations/20260921040000_harden_foundation_authorization.sql` revokes `USAGE` on `private` from `anon` and grants `USAGE` to `authenticated` so membership helpers can run inside RLS. RSVP does not add `anon` `USAGE` on `private`. Membership helpers stay in `private` and are not moved.
- `pgcrypto` is installed in `extensions`. With `search_path = ''`, HMAC and random bytes must be `extensions.hmac` and `extensions.gen_random_bytes`.
- Application clients (`src/lib/supabase/server.ts`, `src/lib/supabase/env.ts`) use the publishable key only. `.env.example` marks `SUPABASE_SECRET_KEY` optional and not required for the foundation. RSVP must stay on that model.
- New objects in `public` can be granted to `anon`, `authenticated`, and `service_role` by default (`auto_expose` in `config.toml`). The future migration revokes those defaults and grants only the roles named below. Do not create these functions in `graphql_public`.
- Supabase's rule for this shape: a `SECURITY DEFINER` function in an exposed schema is callable on the Data API with the owner's privileges. Do not put one in `public` or `graphql_public`.

```text
Data API / Next.js (publishable key, or the member JWT)
        |
        v
public RPC
SECURITY INVOKER
search_path = ''
no table access
        |
        v
rsvp_internal function
SECURITY DEFINER
search_path = ''
owner = rsvp_definer
not in [api] schemas
        |
        v
narrow table operations
```

### Public wrappers

These names are the only Data API RPCs. Each one is `SECURITY INVOKER`, `search_path = ''`, and contains no dynamic SQL. It does not read or write a table. It does not touch Vault. It calls exactly one schema-qualified `rsvp_internal` function and returns that function's composite. A bug in the wrapper runs as `anon` or `authenticated`. It does not become `rsvp_definer`.

Guest. `EXECUTE` granted to `anon` and to `authenticated`. `auth.uid()` is not consulted. The raw secret is the credential.

| Wrapper | Calls |
|---|---|
| `public.exchange_rsvp_session(raw_token text, slug text)` | `rsvp_internal.exchange_rsvp_session(raw_token, slug)` |
| `public.read_rsvp(raw_session_secret text, slug text)` | `rsvp_internal.read_rsvp(raw_session_secret, slug)` |
| `public.submit_rsvp(raw_session_secret text, slug text, payload jsonb)` | `rsvp_internal.submit_rsvp(raw_session_secret, slug, payload)` |

There is no separate resolve RPC. The server action calls `exchange_rsvp_session`, sets the HttpOnly cookie from `session_secret`, and does not serialize that secret into a client component. Later reads and posts call `read_rsvp` and `submit_rsvp` with the cookie value. A later visit with `?t=` calls exchange again.

Member. `EXECUTE` granted to `authenticated` only. Revoked from `anon`.

| Wrapper | Calls | Authorization, enforced inside `rsvp_internal` |
|---|---|---|
| `public.issue_rsvp_invitation(guest_id uuid)` | `rsvp_internal.issue_rsvp_invitation(guest_id)` | `private.can_edit_wedding`. Generates the raw token with `extensions.gen_random_bytes(32)`. The caller cannot supply a token or a digest. Revokes any other non-revoked invitation for the guest and returns the raw token once. This is regeneration. |
| `public.revoke_rsvp_invitation(invitation_id uuid)` | `rsvp_internal.revoke_rsvp_invitation(invitation_id)` | `private.can_edit_wedding`. Sets `revoked_at`. Does not return a token. |
| `public.get_rsvp_invitation_metadata(guest_id uuid)` | `rsvp_internal.get_rsvp_invitation_metadata(guest_id)` | `private.is_wedding_member`. Returns id, status, `issued_at`, `expires_at`, `revoked_at`, `last_used_at`. No raw token, no `token_hash`, no pepper. |

The Next.js member actions call these with the existing cookie session (publishable key + user JWT). They do not impersonate the member with a backend key.

No function parameter is named or typed as a digest. Passing the stored `token_hash` bytes or their hex form in `raw_token` or `raw_session_secret` computes a different HMAC and fails closed.

The wrapper may reject a value that is not text before the call. It does not branch on expiry, revocation, or slug.

### `rsvp_internal`

New schema. It is not `private`, and it is not added to `[api] schemas` or `extra_search_path`. `private` already holds membership helpers, and `authenticated` already has `USAGE` there. Giving `anon` `USAGE` on `private` would widen that schema. RSVP gets its own boundary instead.

```text
REVOKE ALL ON SCHEMA rsvp_internal FROM PUBLIC;
GRANT USAGE ON SCHEMA rsvp_internal TO anon, authenticated;
```

`USAGE` does not publish the schema on PostgREST. Every call is schema-qualified because `search_path` is empty.

Privileged functions:

| Function | Mode |
|---|---|
| `rsvp_internal.exchange_rsvp_session(raw_token text, slug text)` | `SECURITY DEFINER`, owner `rsvp_definer` |
| `rsvp_internal.read_rsvp(raw_session_secret text, slug text)` | `SECURITY DEFINER`, owner `rsvp_definer` |
| `rsvp_internal.submit_rsvp(raw_session_secret text, slug text, payload jsonb)` | `SECURITY DEFINER`, owner `rsvp_definer` |
| `rsvp_internal.issue_rsvp_invitation(guest_id uuid)` | `SECURITY DEFINER`, owner `rsvp_definer` |
| `rsvp_internal.revoke_rsvp_invitation(invitation_id uuid)` | `SECURITY DEFINER`, owner `rsvp_definer` |
| `rsvp_internal.get_rsvp_invitation_metadata(guest_id uuid)` | `SECURITY DEFINER`, owner `rsvp_definer` |

Supporting helpers in the same schema (`rsvp_digest`, match, payload, throttle) are also `SECURITY DEFINER` or are only executable by `rsvp_definer`. They are not Data API RPCs. The public wrapper does not call them. The one internal function it calls may.

`search_path = ''`. Fully qualified names. No dynamic SQL. They do not `RAISE` for an authorization failure.

`EXECUTE` is revoked from `PUBLIC` on every function in the schema.

| Function | `EXECUTE` |
|---|---|
| Three guest functions | `anon` and `authenticated` only |
| Three member functions | `authenticated` only. Not `anon`. |
| `rsvp_internal.rsvp_token_pepper()` | `rsvp_definer` only. See below. |
| Other helpers | `rsvp_definer` only |

`anon` can execute a guest internal function because the invoker wrapper runs as `anon` and must be allowed to call it. That grant is not a PostgREST route: `rsvp_internal` is not an exposed schema, and `anon` is not a login role. `EXECUTE` does not include `SET ROLE`.

Do not `GRANT rsvp_definer` to `anon`, `authenticated`, `authenticator`, `service_role`, or any application user.

### `rsvp_definer`

`NOLOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `BYPASSRLS`.

`BYPASSRLS` is accepted only because all of the following are true:

- the role cannot log in
- it is not a member of any API role, and no API role is a member of it
- the exposed wrappers are `SECURITY INVOKER`, not `SECURITY DEFINER`
- it owns only the non-exposed RSVP functions in `rsvp_internal`
- table and column grants, not `BYPASSRLS` alone, are the blast radius

`BYPASSRLS` does not grant table privileges and is not `service_role`. The application has no connection string and no JWT for this role. The future migration must record:

```text
rolcanlogin = false
rolsuper = false
rolcreatedb = false
rolcreaterole = false
rolbypassrls = true
```

and must prove `anon`, `authenticated`, and `authenticator` cannot `SET ROLE rsvp_definer`.

Grants to `rsvp_definer`:

- `SELECT`/`INSERT`/`UPDATE`/`DELETE` on invitation and session tables
- `SELECT`/`INSERT`/`UPDATE`/`DELETE` on the RSVP answer tables the public submit writes
- column-level `SELECT`/`UPDATE` on the guest columns the public payload and submit need (`id`, `wedding_id`, `first_name`, `plus_one_allowed`, and the RSVP fields the public form is allowed to change). No grant on `private_notes`, `email`, or `phone`. Public writes to `private_notes`, email, phone, household, side, and `plus_one_allowed` stay forbidden
- `SELECT` on the site slug and on the guest's invited events
- `EXECUTE` on `private.can_edit_wedding(uuid)` and `private.is_wedding_member(uuid)`
- `EXECUTE` on `rsvp_internal.rsvp_token_pepper()`

No grant on `auth.users`, budget, vendors, storage, private files, unrelated wedding tables, or arbitrary reads of `wedding_members`. No `USAGE` on `vault`. No `SELECT` on `vault.decrypted_secrets` or `vault.secrets`. A buggy statement cannot read those objects. The membership helpers are not modified.

### Pepper

Selected store: **Supabase Vault**, secret name `rsvp_token_pepper`. Not a Vercel variable. Not in `public`.

`rsvp_definer` does not read the view. One function does:

```text
rsvp_internal.rsvp_token_pepper()
owner = postgres
SECURITY DEFINER
search_path = ''
no arguments
```

It selects `decrypted_secret` from `vault.decrypted_secrets` where `name = 'rsvp_token_pepper'` and returns that single value. It accepts no name, no id, and no other input. It does not enumerate secrets, return a second row, or return metadata. `EXECUTE` is revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to `rsvp_definer`. It is not a Data API RPC.

The future migration enables `supabase_vault` and revokes `USAGE` on `vault` and `SELECT` on `vault.decrypted_secrets` from `anon`, `authenticated`, and `rsvp_definer`. An operator inserts the secret with Vault's create-secret API. No RSVP RPC returns the pepper. If it is missing, public calls return `invalid` and member issue fails without inventing a token.

HMAC stays in Postgres. `rsvp_internal` calls `extensions.hmac` after reading the pepper through `rsvp_internal.rsvp_token_pepper()` only. The caller never supplies a digest.

| Placement | Verdict |
|---|---|
| A. Vault, read by the postgres-owned single-secret function | **Selected.** A dump of `invitations` has no pepper. Pepper plus digest does not invert a 256-bit token, and no RPC accepts the digest. Next.js holds the publishable key, which is already public. |
| B. Pepper in the Next.js environment | Rejected. The database must hash the raw token, so a Vercel pepper is unused, or the server sends a digest and that digest becomes a bearer. |
| C. Dedicated login role | Rejected. It is not `service_role`, and it is still a new application credential. |

### Table access

`anon` has no `SELECT`, `INSERT`, `UPDATE`, or `DELETE` on:

- guests
- invitations
- RSVP responses and per-event answers
- RSVP sessions

`authenticated` has no table privileges on `invitations` or `rsvp_sessions`. PostgREST `select=*` cannot return `token_hash` or `session_hash`. Do not create a `public` view over those tables. Member metadata goes through `public.get_rsvp_invitation_metadata` only.

RLS stays enabled on every new table. Grants keep the digests off the API. Policies for a later member read of guests and RSVP answers must not point at invitation or session rows.

### Member authorization

`rsvp_internal.issue_rsvp_invitation` and `rsvp_internal.revoke_rsvp_invitation` call `private.can_edit_wedding` on the wedding that owns the guest or the invitation. `rsvp_internal.get_rsvp_invitation_metadata` calls `private.is_wedding_member`. Both helpers already exist, use `auth.uid()`, and keep `search_path = ''`. They stay in `private`. `SECURITY DEFINER` does not replace `auth.uid()` with the function owner, so the member JWT is still the actor. Viewers fail `can_edit_wedding` and cannot issue or revoke. This ADR does not change helper bodies or their role meanings, and it does not grant `anon` `USAGE` on `private`.

### Uniform public failure

These are one result, `status = 'invalid'`, with an empty payload:

- unknown token or session
- malformed token or session
- expired
- revoked
- wrong slug or other wedding
- unpublished or unknown slug
- a stored `token_hash` or `session_hash` presented as the raw secret
- missing Vault secret on the public path

The internal function does not `RAISE` for any of those. PostgREST then cannot turn expiry, a unique violation, or a missing row into different HTTP errors or different `message` strings. Next.js maps `invalid` to the single HTTP 404 page. Direct Data API callers receive the same JSON.

`status = 'locked'` is returned only after the raw secret has already matched and the couple has set `rsvp_locked_at`. It is not used for an unknown secret.

`status = 'validation'` is returned only after the session has matched, and only for plus-one and event rules. It does not echo other guests.

Normalization is in the internal function first. Next.js only maps the status codes. It must not inspect SQLSTATE from these RPCs, because a successful call does not raise.

### Rate limiting

Direct Data API access to the public wrappers is accepted. Those wrappers call `rsvp_internal`, and the limiter runs inside that database call. A website `GET` or `HEAD` is not what persists a counter. Supabase cannot write a limiter row from a read-only `GET` or `HEAD`.

Distinct raw tokens are not stopped by a shared bucket. A 256-bit uniform secret makes online discovery computationally infeasible. **That entropy is the resistance to distinct-token guessing.** An IP header is not.

Do not treat `x-forwarded-for` or `cf-connecting-ip` as a trusted client address. `current_setting('request.headers', true)` includes headers the caller sent. The leftmost `x-forwarded-for` value is the spoofable end of that list. Do not use `Sb-Forwarded-For`. Auth honors that header only for a secret key, and RSVP does not take a secret key.

Two limits are in force. Numbers are initial defaults, not a tuned product guarantee.

| Key | Limit | What it does not do |
|---|---|---|
| `throttle:` digest of the presented raw secret | 10 misses / 1 hour | Does not stop a caller who changes the raw token on every guess |
| Invitation id, after a match | 20 submits / 1 hour | Does not run before the secret has matched |

The `throttle:` digest is not the invitation digest and is not accepted by any RPC. The counter table is `rsvp_internal.rsvp_throttle_buckets`: no API exposure, no grants to `anon` or `authenticated`, short TTL. Do not store the raw secret, the invitation digest, or the session digest.

Over the limit, the function returns `status = 'rate_limited'` with no match and no mismatch. Next.js maps that to HTTP 429. The same status is returned for a live secret and a dead one. Do not revoke a valid invitation because of misses.

```text
IP RATE LIMIT = NOT A SECURITY DEPENDENCY
```

The old 30-requests-in-10-minutes and 100-requests-in-24-hours figures are candidate defaults for a future IP limiter only. They are not guarantees.

An IP bucket may be turned on after a test that does all of the following:

1. Call the public Data API RPC directly.
2. Spoof `X-Forwarded-For`.
3. Spoof `CF-Connecting-IP`.
4. Show that the limiter key stays the gateway's client address.
5. Name that header or value in the implementation note.

Until that test passes, forged forwarding headers are not a bucket key.

The HttpOnly cookie is what a foreign page would need for CSRF against the Next.js route. `SameSite=Lax` plus an `Origin` allowlist stay on that route. A direct RPC call does not receive the cookie. It has to present the raw secret, which is the same bar as holding the link.

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

1. `public.exchange_rsvp_session` calls `rsvp_internal.exchange_rsvp_session`. That function recomputes the digest. Do not query guests by slug, and do not accept a digest from the caller.
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

- Cookie value: the raw session secret returned once by `public.exchange_rsvp_session`. It is generated in Postgres with `extensions.gen_random_bytes(32)`. It is not the invitation token.
- Store the `session:` digest from `rsvp_internal` only. The label is not `invitation:` and not `throttle:`.
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

### Logging and audit
Log and store `invitation_id`, `wedding_id`, `guest_id`, outcome, and timestamp on success and on member actions. Public failures return `invalid` without a separate stored reason that a Data API caller can read. The private implementation may record one internal outcome for operators (`invalid`, `expired`, `revoked`, `slug_mismatch`, `locked`, `rate_limited`, `validation_error`, `success`) in a table that `anon` and `authenticated` cannot select. That log stores no raw secret, no invitation digest, no throttle digest, and no pepper.

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

The Wave A mock is this construction, including a public `edn_fix_` prefix on fixtures. Selecting it would adopt unreviewed code because it already exists. HMAC with a pepper that is not stored on the invitation row makes a stolen `invitations` table useless as a set of bearers. The lookup stays a unique index. The pepper lives in Vault, not in the application environment.

A password KDF (Argon2id, bcrypt, scrypt) is the wrong repair. Those functions are for low-entropy passwords. They are deliberately slow, they use a random salt, and they cannot be the key of a unique index without storing a second lookup value. A slow public endpoint is also a denial-of-service lever. High-entropy bearer secrets use a keyed fast digest.

### 2. HMAC-backed opaque token
**Selected.** Described under Decision.

The token stays opaque and random. The stored value is a keyed digest. Revocation, expiry, plus-one policy, and the event list stay in rows the helper reads after it recomputes the digest, so they cannot go stale inside the credential. A stolen invitation table is not a set of RPC credentials, because the RPC will not accept `token_hash`. The pepper is not in that table. Pepper plus digest still does not invert a 256-bit token, and it still does not authenticate. Pepper disclosure alone does not mint a link either: the attacker can compute HMACs, and those digests are not in the table unless they can also insert rows, which `anon` cannot do.

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
Do not add a durable public table of failed tokens. Throttle counters live in `rsvp_internal.rsvp_throttle_buckets` with a short TTL. They may store the `throttle:` digest. They must not store the raw secret, the invitation digest, or the session digest. An IP is not stored as a security key unless the gateway test in Rate limiting has passed.

### `rsvp_locked_at`
One timestamp on the wedding or wedding settings. Null means guests with a live invitation may still update.

### RLS and grants (when the migration exists)
RLS on for every new table. Grants are specified under Database access boundary. `anon` has no direct data API access to the four guest tables. `authenticated` has no direct access to invitations or sessions. There is no `service_role` client on this path. Do not add a `public` view that selects `token_hash` or `session_hash`.

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
| Anonymous limits | Missing token is the uniform 404. The repeat-secret cap returns a generic 429 without confirming a match. A valid invitation is not revoked solely by misses. IP is not required for that result. |
| Replay / update | Second submit changes the same RSVP in place. Identical resubmit succeeds. Confirmation GET after accept or decline shows only that guest. After revoke, the same body is a 404. After RSVP lock, a valid token does not write. |
| Plus-one | `plus_one_allowed = false` rejects a plus-one name or attendance flag. Decline cannot record a plus-one. The submit does not insert a guest and does not issue a token. |
| Events | An event id the guest was not invited to is rejected or dropped. Other events are not listed. |
| Regeneration | New link works. Previous raw token gets the uniform 404. Only one non-revoked invitation remains. |
| Leakage | Issuance response is the only member response that contains the raw token. Later member GET does not. Logs and test captures of public requests do not contain `t`, the digest, or the pepper. Public and member payloads do not contain `token_hash`. |
| Cookie session, when built | Cookie is not the invitation token. Session dies when the invitation is revoked. POST from a foreign `Origin` is rejected. |
| Slug authority | A live raw token with a mismatched slug does not authorize. A matching slug with a bad token does not authorize. |
| Anon table denial | `anon` `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are denied on guests, invitations, RSVP responses, and RSVP sessions. |
| Authenticated secret columns | `authenticated` `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are denied on invitations and RSVP sessions. |
| Digest as bearer | Presenting the stored `token_hash`, or its hex, as `raw_token` returns the same `invalid` result as a random token. Presenting `session_hash` as `raw_session_secret` does the same. |
| Privileged key | The RSVP server path and member issue/revoke do not read `SUPABASE_SECRET_KEY` and do not construct a service-role client. |
| RPC output | On success, `exchange_rsvp_session`, `read_rsvp`, and `submit_rsvp` return only the public field set, including when called on the Data API. The pepper, `token_hash`, `session_hash`, email, phone, private notes, and any other guest are absent. `exchange_rsvp_session` may return the new raw session secret once, to the server action only. |
| Private helper privileges | `anon` and `authenticated` cannot `EXECUTE` `rsvp_internal.rsvp_token_pepper()` or the supporting helpers. They also cannot `EXECUTE` functions in `private` beyond the membership grants that already exist for `authenticated`. |
| Function exposure | Every `public` RSVP RPC is `SECURITY INVOKER` (`prosecdef = false`). No exposed RSVP function is `SECURITY DEFINER`. Every `rsvp_internal` privileged function is `SECURITY DEFINER`. `rsvp_internal` is not in `[api] schemas`. |
| Role attributes | `rsvp_definer` has `rolcanlogin = false`, `rolsuper = false`, `rolcreatedb = false`, `rolcreaterole = false`, `rolbypassrls = true`. |
| SET ROLE | `anon`, `authenticated`, and `authenticator` cannot `SET ROLE rsvp_definer`. |
| Exposed function privileges | `anon` can `EXECUTE` only the three guest wrappers and their three `rsvp_internal` targets. `anon` cannot `EXECUTE` issue, revoke, or metadata. `authenticated` can `EXECUTE` the member wrappers. Membership is still checked inside `rsvp_internal`. |
| Vault isolation | `anon`, `authenticated`, and `rsvp_definer` cannot `SELECT` `vault.decrypted_secrets`. `rsvp_internal.rsvp_token_pepper()` takes no arguments, returns only that secret, and is not a Data API RPC. No public or member RPC returns the pepper. |
| Forged forwarding headers | A direct Data API call that sends `X-Forwarded-For` or `CF-Connecting-IP` does not create a trusted IP bucket. IP is not a security dependency until the gateway test passes and names its source. |
| Repeat and submit caps | The same presented secret trips the `throttle:` miss cap. After a match, submits trip the per-invitation cap. A different raw token on each guess is not stopped by those caps. |
| Member authorization | Issue and revoke fail for a non-member and for a viewer. They succeed for a role that passes `private.can_edit_wedding`, using that user's JWT. |
| Cross-wedding | A token or session from wedding A, sent with wedding B's slug, is `invalid` and writes neither wedding. |

## Consequences
+ A stolen invitation table is not a set of RSVP credentials. The public RPC will not accept `token_hash` or `session_hash`.
+ A compromised Next.js process does not gain `service_role` or the pepper. It holds the publishable key, which is already public.
+ Revocation, regeneration, expiry, and RSVP corrections are ordinary row updates inside the definer functions.
+ The public surface stays one guest wide, which matches UJ-03 and the enumeration threat in `docs/SECURITY.md`.
+ Wave A must replace `hashInvitationToken` (unsalted SHA-256) and the `edn_fix_` fixtures. Those strings are not this design.
− Each environment needs the Vault secret `rsvp_token_pepper`. A missing secret fails closed. It is not a Vercel env var.
− Pepper rotation invalidates outstanding links. That is accepted.
− The cookie exchange, log redaction, and the repeat-secret throttle are mandatory before production. An IP limiter is not.
− `rsvp_definer` has `BYPASSRLS` and a short grant list. Those grants are the blast radius of a bug in `rsvp_internal`. They must not grow to cover unrelated tables or Vault.
− Household-level RSVP links are out of scope. A future product change needs a new ADR.
− This decision does not add tables, RLS, routes, or application code.

## Consistency
This ADR is the RSVP credential and the RSVP access path.

- ADR-003. Guests still have no accounts. The RPC design is a `public` `SECURITY INVOKER` wrapper and an `rsvp_internal` definer. Membership helpers stay in `private`.
- ADR-004 and ADR-005. Paths are unchanged. The slug is a binding check, not a grant.
- `docs/DATABASE.md`. "RSVP writes via authenticated-as-anon RPC with token proof" is `exchange_rsvp_session`, `read_rsvp`, and `submit_rsvp`. The shorter `invitations` column sketch is superseded by the column list in this ADR when a migration is written. This change does not edit `DATABASE.md`.
- `docs/SECURITY.md`. Definer helpers use `search_path = ''` and fully qualified names. RSVP does not use a `service_role` key. Corrected in this revision.
- `docs/ARCHITECTURE.md`. RSVP does not use `service_role`. Public wrappers are `SECURITY INVOKER`. Privileged work is the non-exposed definer. Corrected in this revision.

## Related
- ADR-003 — guests authenticate with invitation tokens, not user accounts
- ADR-004 — public host path is `/w/{slug}`
- ADR-005 — public RSVP versus `/app/weddings/[id]/guests/rsvp`
- `docs/SECURITY.md` — RSVP threat and the 128-bit floor this ADR raises to 256 bits for issuance
- `docs/DATABASE.md` — anon RPC with token proof; column set above supersedes the shorter sketch when the migration is written
