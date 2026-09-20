# ADR-002: Block-based Wedding Website Builder

## Status
Accepted — 2026-09-20

## Context
Website is P0. Free-form builders (Wix-like) are costly, hard to keep elegant, and slow to ship securely.

## Decision
Ship a **block-based** builder: fixed section types, ordered list, per-section content JSON, separate template/theme presentation. Public route `/w/[slug]`. Architect for future subdomain/custom domain.

## Consequences
+ Fast MVP, consistent quality, content preserved across template switches
+ Easier accessibility and SEO
− Less layout freedom than free-form canvas (acceptable for MVP)
