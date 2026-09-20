# Technical risks & open decisions

## Risks (active)

| ID | Risk | Severity | Mitigation | Status |
|---|---|---|---|---|
| R1 | RLS misconfiguration leaks wedding data | P0 | Membership helpers + db tests + isolation E2E | Planned |
| R2 | RSVP token enumeration / abuse | P0 | Hash tokens, rate limit, narrow RPC | Planned |
| R3 | Website builder scope explosion | P1 | Fixed section catalog (ADR-002) | Accepted |
| R4 | Agent file collisions | P1 | Branch/worktree isolation rules | Accepted |
| R5 | No Supabase/Vercel yet | P1 | Scaffold first; human provisions | Open |
| R6 | Next.js security advisories | P0 | Pin ≥16.3.3 patched Active LTS | Accepted |

## Decisions to take (human)

| ID | Decision | Default if silent | Blocks |
|---|---|---|---|
| D1 | Supabase project + keys | Local stubs | Live auth/data |
| D2 | GitHub remote | Local git only | PR/CI on GH |
| D3 | Vercel project | Local only | Preview/prod |
| D4 | Default UI locale FR vs EN | FR marketing / EN code | Copy only |
| D5 | Google OAuth in MVP? | No — email/magic link | None |

No critical contradiction blocks Phase 2 foundation scaffolding.
