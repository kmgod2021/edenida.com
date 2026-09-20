# Edenida — Security Model

## Threat priorities
1. Cross-wedding data access (IDOR / HPE)
2. Guest list enumeration via RSVP/public APIs
3. Service role / secret leakage to client
4. Storage of private contracts in public buckets
5. XSS in website builder rich text
6. RSVP spam / token brute force
7. CSRF on cookie auth mutations (SameSite + origin checks)

## AuthZ model
```
User → wedding_members.role → Wedding resources
```

| Role | Capabilities (MVP) |
|---|---|
| owner | full + manage members + delete wedding |
| partner | full edit except delete wedding / transfer |
| collaborator | edit planning data; no billing/members (future) |
| wedding_planner | schema-ready; treat like collaborator until productized |
| viewer | read-only; schema-ready |

## Supabase rules
- RLS **ON** every exposed table
- Explicit grants; do not rely on default wide grants
- Policies per command: SELECT/INSERT/UPDATE/DELETE
- Use `(select auth.uid())` form for performance
- `service_role` / secret keys: server only
- Prefer `SECURITY DEFINER` membership helpers with `search_path = public` (locked)

## Public website
- Published content only
- `is_private`: require token/password gate; `X-Robots-Tag: noindex`
- No guest PII in public payloads
- Gallery/assets: public bucket only for explicitly published assets

## Storage
| Bucket | Visibility |
|---|---|
| `public-site` | public read for published paths |
| `wedding-private` | private; member RLS; signed URLs |

Path convention: `{wedding_id}/...` + policy membership check.

## RSVP
- Opaque tokens (≥128 bits), store hash
- Rate limit by IP + token
- Single-guest scope responses
- Validate with Zod; sanitize text

## XSS
- Prefer structured fields over free HTML
- If rich text later: sanitize server-side allowlist
- CSP headers on Vercel/Next config

## Secrets
`.env.local` never committed. CI via GitHub Secrets. Document required vars in README.

## Required security tests
- Two-user isolation Playwright + db tests
- Anon cannot SELECT guests
- Invalid RSVP token rejected
- Unpublished slug 404
- Private file unsigned URL 403

## Review gate
Phase 10: dedicated SECURITY agent review before production claim.
