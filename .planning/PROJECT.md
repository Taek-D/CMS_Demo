# CMS Auto-Debit Demo

## What This Is

This project is a Next.js + Supabase demo that recreates a Hyosung CMS-style member and admin auto-debit journey closely enough to validate real operational flows, not just mocked screens.

## Core Value

Member and admin flows should be realistic enough that we can trust the product behavior we show in a portfolio, a client conversation, or a delivery-risk review.

## Current Milestone

**Milestone:** `v1.0 Supabase Migration & Flow Verification`

**Current state:** Phase 3 is complete and verified. Phase 4 is the next planned build.

## Requirements

### Validated

- [x] Members can sign in and move through the current account, consent, and payment areas of the app.
- [x] Members can register, edit, and remove child records from a dedicated `/children` flow.
- [x] Children can be linked to a childcare center and class through a searchable center-first flow.
- [x] Admins can view parent, child, childcare center, and class relationships together on the existing members CRM surface.
- [x] The childcare domain was added additively without changing member number generation or billing table behavior.
- [x] Deterministic browser automation now covers `/dashboard`, `/account`, `/consent`, `/payments`, `/children`, and `/admin/members`.

### Active

- [ ] `MEM-01`: Close the remaining real signup blocker once Supabase Auth email throttling allows another public signup attempt.
- [ ] Phase 4: Add overdue-member management and childcare/class monthly Excel statement export for stronger CRM realism.

### Out of Scope

- Full visual redesign of the product.
- Production-grade CMS integration fidelity beyond the current demo-safe billing and webhook simulation.
- Expanded password recovery and account lifecycle features beyond what is needed for milestone validation.

## Context

- Application code lives under `src/app/**`, `src/components/**`, and `src/lib/**`.
- Supabase schema changes are tracked in `supabase/migrations/*.sql`.
- `.planning/codebase/` contains the current codebase map.
- `003_fix_rls_and_constraints.sql`, `004_fix_member_no_generation.sql`, `005_create_member_profile_on_auth_signup.sql`, and `006_parent_childcare_domain.sql` are now applied on the linked remote Supabase project.
- Phase 3 added a typed childcare domain, member child-management flow, admin CRM relationship view, automation hooks, and a passing Playwright regression.

## Constraints

- **Stack continuity:** Keep working inside the existing Next.js App Router + Supabase architecture.
- **Security boundary:** Member flows should stay on auth-derived ownership and RLS-active clients wherever possible.
- **Portfolio realism:** Additions should make the product look more like an actual nursery operations system, not a generic payment demo.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep admin auth centralized in `getAdminAccess()` / `requireAdmin()` | Avoid drift between admin pages and admin-only APIs | Implemented |
| Keep childcare schema additive | Protect existing member numbering and billing behavior while expanding domain realism | Implemented |
| Add `/children` as a dedicated member route | Make the parent-childcare domain explicit and discoverable for portfolio review | Implemented |
| Keep admin childcare visibility on the existing `/admin/members` surface | Increase CRM realism without fragmenting the admin experience | Implemented |
| Use deterministic seed data plus Playwright smoke coverage | Make the portfolio demo reproducible on a linked Supabase environment | Implemented |

## Current State

- Phase 1 and Phase 2 validation work established the hardened member/admin billing baseline.
- Phase 3 is complete and verified against requirements `P3-01` through `P3-04`.
- Phase 4 is the next planned phase: overdue management plus monthly statement export.

## Evolution

This document should be updated whenever a phase materially changes validated scope, active blockers, or the next planned delivery target.

---
*Last updated: 2026-04-08 after Phase 3 verification passed*
