# ADR-003: Membership-based multi-tenancy with RLS

## Status
Accepted — 2026-09-20

## Context
Multiple users collaborate on one wedding; strict isolation between weddings is a release gate.

## Decision
Tenancy root = `weddings`. Access via `wedding_members`. All wedding resources keyed by `wedding_id`. RLS policies call shared membership helpers. Guests use invitation tokens, not user accounts.

## Consequences
+ Clear security model; testable
− Every table must include wedding_id (or join path) and policies
− Token RSVP requires careful RPC design
