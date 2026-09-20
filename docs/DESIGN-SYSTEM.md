# Edenida — Design System (v0)

## Intent
Premium editorial wedding planning — warm, calm, romantic, modern.
Not corporate dashboards. Not generic AI purple gradients. Not glassmorphism theater.

## Direction (locked v0)
- **Palette:** warm ivory paper background, deep ink text, soft blush accent, muted sage secondary, champagne highlight
- **Avoid:** purple-indigo SaaS clichés, cold gray enterprise, excessive cards, rounded-full pill clusters
- **Imagery:** real wedding atmosphere when present; full-bleed only on marketing/public site heroes
- **App chrome:** quiet; brand mark present; content first

## Tokens (CSS variables)
```css
--color-bg: /* warm paper */
--color-bg-elevated: /* soft cream */
--color-ink: /* near-black warm */
--color-ink-muted: /* brown-gray */
--color-accent: /* dusty rose / blush */
--color-accent-2: /* sage */
--color-line: /* hairline warm */
--color-danger: /* restrained red */
--font-display: /* expressive serif for brand/headings */
--font-body: /* refined humanist sans — not Inter/Roboto/Arial defaults */
--radius-sm/md/lg
--space-1…8
--shadow-soft /* rare, subtle */
```

## Typography
- Display for brand + section titles
- Body for UI
- Strict type scale; generous line-height for calm reading

## Components
Start from shadcn primitives restyled to tokens: Button, Input, Label, Select, Dialog, Dropdown, Tabs, Toast, Table, Form.

**Cards:** default none. Use only when they enclose a clear interaction.

## States (required on every module)
Empty · Loading · Error · Success — calm copy, one next action.

## Motion
2–3 intentional motions: page enter fade/slide subtle, publish confirmation, builder section reorder. Honor `prefers-reduced-motion`.

## Accessibility
WCAG 2.2 AA reasonable target: focus rings, labels, contrast, semantics, keyboard.

## Website templates
Six presenters sharing content model: Editorial, Modern, Romantic, Minimal, Garden, Luxury — distinct typography/layout rhythm, same sections.
