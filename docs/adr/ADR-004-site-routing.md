# ADR-004: Public site path slug before custom domains

## Status
Accepted — 2026-09-20

## Context
Custom domains and subdomains are valuable but operationally heavy (DNS, TLS, verification).

## Decision
MVP publishes at `edenida.com/w/{slug}`. Reserve unique slugs and host-aware middleware hooks for `{slug}.edenida.com` and custom domains later without schema rewrite (`wedding_sites.slug`, future `custom_domains` table).

## Consequences
+ Faster MVP publish loop
− Brand vanity URLs deferred
