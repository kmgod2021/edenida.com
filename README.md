# Edenida

**One wedding. One workspace. Everything organized.**

Edenida is a modern wedding planning SaaS: website builder, guests & RSVP, checklist, budget, vendors, timeline, seating, notes, files, and inspiration.

## Stack

- Next.js 16 (App Router) · React · TypeScript · Tailwind · shadcn/ui
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Playwright · GitHub Actions · Vercel
- pnpm

## Documentation

Start here:

- [Master Build Plan](docs/MASTER-BUILD-PLAN.md)
- [Status](docs/STATUS.md)
- [MVP](docs/MVP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [AGENTS.md](AGENTS.md)

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill Supabase keys when available
pnpm dev
```

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

## Environment

See `.env.example` for required variables. Never commit secrets.

## License

Proprietary — All rights reserved.
