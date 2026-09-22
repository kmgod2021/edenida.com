# Website builder — persistence handoff

**Status:** `READY_FOR_DATA_INTEGRATION`  
**Wave:** A (in-memory)  
**Owner of the next slice:** Supabase / feature agent with migration rights

Wave A does not write to the database. The builder edits a `SiteDocument` in React state, seeded by `createMemoryWebsiteRepository`. Refreshing the page restores the fixture.

## Invariant

**Content ≠ presentation.**

| Concern | Fields | Template switch |
|---|---|---|
| Content | `sections[]` (`id`, `type`, `enabled`, `sortOrder`, `content`) | Preserved (deep-equal) |
| Presentation | `presentation.templateId`, `presentation.theme` | Replaced with the template default theme |

`switchTemplate` in `domain/operations.ts` is the reference implementation. Do not merge theme tokens into section JSON.

## Document → tables

Map `SiteDocument` (`domain/types.ts`) onto the model in `docs/DATABASE.md` and `docs/ARCHITECTURE.md`. Do not invent extra tables in this wave.

### `wedding_sites` (one primary site per wedding in MVP)

| Column | Source |
|---|---|
| `id` | `site.id` |
| `wedding_id` | `site.weddingId` |
| `slug` | `site.slug` (unique among published) |
| `status` | `draft` \| `published` |
| `is_private` | `site.isPrivate` |
| `template_id` | `presentation.templateId` |
| `theme` | `presentation.theme` JSON |
| `published_at` | null until publish |

Suggested theme JSON shape (already validated by `themeSchema`):

```json
{
  "background": "#f7f1ea",
  "surface": "#fffaf5",
  "ink": "#2a211c",
  "muted": "#6b5d54",
  "accent": "#8c4a3a",
  "accentSecondary": "#7a8f7a",
  "displayFont": "serif",
  "bodyFont": "sans"
}
```

### `site_sections`

One row per block. MVP allows at most one row per `type` (enforced in `siteDocumentSchema`).

| Column | Source |
|---|---|
| `id` | `section.id` |
| `site_id` | `site.id` |
| `type` | `section.type` |
| `enabled` | `section.enabled` |
| `sort_order` | `section.sortOrder` |
| `content` | `section.content` JSON, schema per type |

Section catalog (Wave A): `hero`, `countdown`, `story`, `events`, `venue`, `gallery`, `dress_code`, `faq`, `registry`, `rsvp`, `footer`.

Content schemas live in `domain/content.ts`. Reuse them on the server at every write. Do not accept HTML. Image and link fields are plain strings; the renderer only emits `https:` URLs (`domain/urls.ts`).

## Repository

`persistence/repository.ts`:

```ts
interface WebsiteRepository {
  getSite(weddingId: string): Promise<SiteDocument | null>;
  saveSite(site: SiteDocument): Promise<void>;
}
```

`persistence/memory-repository.ts` is the Wave A adapter.

The Supabase adapter should:

1. Live in a **server-only** module. Do not import it from `ui/builder-workspace.tsx`.
2. Use the SSR user client (`src/lib/supabase/server.ts`). Never `service_role` in the browser.
3. Rely on RLS: member can read/write their wedding site; anon can read **published, non-sensitive** fields only. No guest PII in section content.
4. `saveSite` writes presentation and section rows in one transaction-shaped flow (replace section set, or upsert by id + delete missing). Re-validate with `siteDocumentSchema` before write.
5. Keep `switchTemplate` semantics: updating `template_id` / `theme` must not delete `site_sections` rows.

`saveSite` on the memory adapter throws `WebsitePersistenceError` on purpose. The UI does not pretend a save succeeded. It shows “Brouillon local”.

## Routes

| Surface | Wave A | Target |
|---|---|---|
| Builder | `/app/w/[weddingId]/website` | Move with the app shell if `(app)` becomes a route group. Do not mount the builder on `/w/[slug]` — that path is the public site. |
| Public | `src/app/w/[slug]/page.tsx` still `notFound()` | After publish: load the published document and render `ui/site-canvas.tsx`. Unpublished stays 404. Private sites: noindex + gate (later). |
| Fixture flags | `?fixture=empty`, `?fixture=error` | Dev/test only. Do not ship as a public query on the guest site. |

`ui/site-canvas.tsx` is presentational (no hooks). The public page can render it from a server component once a published `SiteDocument` exists.

## RSVP

The RSVP block is **copy only** (heading, intro, deadline label, button label). It does not collect guest data and does not call an RSVP endpoint. Wire the button to the tokenized RSVP flow in a later phase. Do not put guest names, emails, or tokens in `content`.

## Publish (not in Wave A)

Still to build:

- Slug editor + uniqueness check
- `status: published`, `published_at`
- Revalidate `/w/[slug]`
- `is_private` gate
- Hero/gallery files in the `public-site` bucket only after an explicit publish choice

## Security notes for the adapter

- Zod-parse every write (`parseSiteDocument` / `parseSectionContent`).
- Reject non-https URLs at render time even if a bad string is stored.
- No `dangerouslySetInnerHTML`.
- RLS on `wedding_sites` and `site_sections`. Anon select must not include draft rows or other weddings.
