<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Edenida

This repository is built by coordinated Cursor agents. Read this file before any implementation work.

## Product
Edenida is a production wedding planning SaaS (not a demo).
Vision: **One wedding. One workspace. Everything organized.**
Canonical docs: `docs/PRODUCT.md`, `docs/MVP.md`, `docs/MASTER-BUILD-PLAN.md`, `docs/STATUS.md`.

## Before coding
1. Read `docs/STATUS.md` and current phase in `docs/ROADMAP.md`
2. Read `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATABASE.md` when touching data/auth
3. Follow Definition of Done in the master prompt / `docs/TEST-STRATEGY.md`

## Mission prompt format (mandatory)
Every delegated mission must start with:

```
AGENT_NAME:
AGENT_ID:
TASK_ID:
ROLE:
OBJECTIVE:
DEPENDENCIES:
ALLOWED_SCOPE:
FORBIDDEN_SCOPE:
EXPECTED_OUTPUT:
ACCEPTANCE_CRITERIA:
REQUIRED_TESTS:
```

No vague prompts like “implement auth”.

## Isolation
Parallel code agents MUST use separate branches/worktrees/cloud VMs.
Serialize: `supabase/migrations/**`, `package.json`, design tokens, root layout, auth middleware.

## Git
Branch: `agent/<agent-id>/<task-id>-<description>`
Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`).
Do not push risky features straight to production. Do not commit secrets.

## Stack
Next.js 16.3.x App Router · TypeScript strict · pnpm · Tailwind · shadcn/ui · Supabase · Zod · Playwright · Vercel · GitHub Actions.

## Security non-negotiables
- RLS on all exposed tables
- No service_role in browser
- No private guest PII on public website APIs
- Never weaken tests to get green

## Status reports
After major steps, emit `EDENIDA BUILD STATUS` and update `docs/STATUS.md` with measurable completion %.

## Subagents
Definitions live in `.cursor/agents/`. Use only agents needed for the current phase.
