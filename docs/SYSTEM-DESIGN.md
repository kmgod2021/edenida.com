# Edenida — System Design

## 1. Context
Edenida is a multi-tenant wedding planning SaaS. Tenancy root = **Wedding**. Authorization = **membership**. Guest-facing surfaces are separate from member app.

```
[Browser]
   │
   ├─ App (authenticated)  ──► Next.js App Router (Vercel)
   │                              │
   │                              ├─ RSC / Server Actions
   │                              └─ Supabase client (user JWT)
   │
   └─ Public /w/[slug]     ──► Next.js (cached where safe)
                                  │
                                  ├─ Public site reads (RLS anon policies)
                                  └─ RSVP submit (token-validated server path)
                                           │
                                   Supabase PostgreSQL + Auth + Storage
```

## 2. Bounded contexts
| Context | Owns |
|---|---|
| Identity | profiles, auth |
| Wedding core | weddings, members, settings |
| Website | sites, sections, themes, publish |
| Guests | households, guests, invitations, rsvps |
| Planning | tasks, events, timeline |
| Money | budget categories/items, payments |
| Vendors | vendors, contacts, vendor files |
| Seating | seating_plans, tables, seat assignments |
| Knowledge | notes, assets, inspiration |

## 3. API boundaries
- Prefer **Server Components + Server Actions** for mutations
- Route Handlers for webhooks / RSVP token endpoints when needed
- No service_role in browser
- Zod validation at every write boundary

## 4. Website builder (application-within-app)
See `ARCHITECTURE.md` § Website Builder.

**Content** (relational + structured JSON for block props)
**Presentation** (template id + theme tokens JSONB)

Template change never deletes content rows.

## 5. Caching / performance
- Public published sites: static-friendly rendering + revalidate on publish
- Member app: dynamic, user-scoped
- Images via Next.js Image + Supabase Storage
- Avoid client waterfalls; colocate fetches

## 6. Environments
| Env | Use |
|---|---|
| local | Next + local/linked Supabase |
| preview | Vercel Preview + staging Supabase project (preferred) |
| production | Vercel + prod Supabase |

## 7. Observability (MVP)
Structured server logs; no secrets/tokens/PII dumps. External APM optional later.
