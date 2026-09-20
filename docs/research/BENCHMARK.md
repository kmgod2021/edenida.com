# Edenida — Functional Benchmark (Product Only)

**Date:** 2026-09-20
**Sources (public product surfaces only — no IP copy):**

1. [planning.wedding](https://planning.wedding/)
2. [WeddingWire.ca App](https://www.weddingwire.ca/app-weddings)
3. [Palm & Grace Wedding Planner Google Sheets](https://palmandgracedesigns.com/products/wedding-planner-google-sheets)

This document extracts **capability patterns** and **UX expectations**. Edenida will not reuse their design, copy, assets, templates, or exact IA.

---

## 1. Planning.Wedding

### Positioning
All-in-one online wedding planning assistant. Low friction (even “no sign-up” mode). Collaborative. Tool-dense.

### Capability map (observed)
| Area | Notes for Edenida |
|---|---|
| Guest list | Dietary needs, preferences, RSVPs |
| RSVP | Real-time tracking via personalized page |
| Wedding website | Share updates, photos, event details |
| Checklist | Tasks + delegation |
| Budget | Cost control / calculator framing |
| Day-of timeline / itinerary | Visual schedule templates |
| Seating chart | Drag-and-drop; ceremony + reception layout |
| Vendors | Directory/marketplace (P2 for Edenida) |
| Notes / album | Post-event photo album, notes |
| Printables | Table cards, place cards, menus (defer) |

### Strengths to match (not copy)
- One workspace for the whole wedding
- Website + RSVP + guests tightly connected
- Seating chart is a differentiator users praise
- Collaboration without heavy process

### Gaps / risks for Edenida to avoid
- Feature sprawl can feel like a toolbox, not a calm product
- “No account” is convenient but weak for durable SaaS security, recovery, multi-device
- Marketplace/vendor directory is a separate business; not MVP

### Edenida differentiation
Account-backed SaaS, security-first (RLS), premium editorial UX, block-based website as P0, no marketplace in MVP.

---

## 2. WeddingWire.ca App

### Positioning
Mobile-first companion around a large wedding marketplace brand.

### Capability map (observed)
| Area | Notes for Edenida |
|---|---|
| Checklist | “Ultimate” checklist framing |
| Vendor manager | Find + manage + message vendors |
| Wedding website | Custom site for guests |
| Budget | Automated numbers / tracking |
| Seating chart | Drag-drop from guest list |
| Guest list | Multi-event RSVP management |
| Dresses | Fashion browse + save favorites |

### Strengths to match
- Clear module list couples recognize
- Website as first-class guest surface
- Guest list ↔ seating ↔ RSVP loop
- Inspiration (“dresses”) as save/board, not only commerce

### Gaps / risks
- Marketplace gravity (vendors/dresses) can overshadow planning calm
- App-centric messaging; Edenida MVP is responsive web first

### Edenida interpretation of “Dresses”
Generic **Inspiration** boards: attire, decor, flowers, cake, stationery, general — image + title + category + URL + note + favorite. No marketplace.

---

## 3. Palm & Grace Google Sheets Planner

### Positioning
Structured offline-style planning in spreadsheets: tabs, charts, checklists, side events (shower, honeymoon).

### Capability map (observed)
| Area | Notes for Edenida |
|---|---|
| Overview / stats | Progress dashboards matter |
| Guest list + seating | Relational mental model already present |
| Budget (simple + detailed) | Dual depth; start simple |
| Timeline checklist + calendar | Date-relative planning |
| Vendors / venues / contacts | Manual CRM, not marketplace |
| Day-of timeline | Explicit hour-by-hour |
| Notes / packing / music | Long-tail organization |
| Bonus events | Shower, bachelorette, honeymoon (P2+) |

### Strengths to match
- Completeness and “mental load reduction” via structure
- Automated progress visibility
- Desktop power-user density done carefully

### Gaps / risks
- Spreadsheet UX is powerful but not premium/mobile-first
- Too many tabs = overwhelm; Edenida must curate MVP surfaces

### Edenida takeaway
Import the **information architecture completeness**, not the spreadsheet metaphor. Progressive disclosure over 30 tabs.

---

## 4. Cross-product consensus (must-have mental model)

Couples expect **one wedding workspace** containing:

1. Wedding website (guest-facing)
2. Guests + RSVP
3. Checklist
4. Budget
5. Vendors (at least personal CRM)
6. Seating
7. Timeline / day-of
8. Notes / files / inspiration

**Non-negotiable integration loops:**
- Guests → RSVP → meal counts → seating
- Budget items ↔ vendors ↔ payments
- Website publish status on dashboard
- Checklist progress on dashboard

---

## 5. Explicit non-goals for Edenida MVP (from benchmark)

- Vendor marketplace / lead gen
- Dress shopping catalog
- Printable place-card factories
- Ceremony floor-plan CAD
- Guest photo album social network
- No-auth anonymous forever mode as primary model
- Custom domains (architect for later; path slug for MVP)

---

## 6. Competitive wedge for Edenida

> **One wedding. One workspace. Everything organized.**
> Premium, calm, editorial product with a best-in-class **block-based wedding website** as the guest hub — secured by membership + RLS — not a cold enterprise PM tool and not a marketplace.
