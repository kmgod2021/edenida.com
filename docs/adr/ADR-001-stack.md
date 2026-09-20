# ADR-001: Next.js 16 App Router + Supabase + Vercel

## Status
Accepted — 2026-09-20

## Context
Edenida needs a production SaaS stack: auth, relational data, file storage, SSR/SEO for public wedding sites, preview deployments, and agent-friendly TypeScript.

## Decision
- Next.js **16.3.x Active LTS**, App Router, TypeScript strict, Tailwind, pnpm
- Supabase PostgreSQL + Auth + Storage with RLS
- Vercel for preview/production
- Playwright for E2E
- shadcn/ui for primitives

## Consequences
+ Single deployable web app with excellent public-site performance path
+ RLS as primary authorization layer
− Coupled to Supabase; migrations discipline required
− Windows local + Vercel Linux CI must both be validated
