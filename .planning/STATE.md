---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-04-07T16:29:12.001Z"
last_activity: 2026-04-08 -- Completed 03-02 member child-management surface
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 4
  completed_plans: 3
---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-06)

**Core value:** Reproduce the member and admin CMS auto-debit journey closely enough that we can validate the full flow without guesswork.
**Current focus:** Phase 03 — parent-childcare-domain

## Current Position

Phase: 03 (parent-childcare-domain) — EXECUTING
Plan: 3 of 4
Status: Ready to execute Plan 04
Last activity: 2026-04-08 -- Completed 03-02 member child-management surface

## Accumulated Context

- `.planning/codebase/` contains the current codebase mapping documents.
- `supabase/migrations/003_fix_rls_and_constraints.sql` is applied on the linked remote Supabase project.
- `supabase/migrations/004_fix_member_no_generation.sql` was executed against the linked remote database and its behavior is now verified through user-scoped inserts.
- `supabase/migrations/005_create_member_profile_on_auth_signup.sql` now creates `cms_members` rows from `auth.users`, removing signup dependence on an immediate client session.
- `npm run lint` passes in the current workspace.

### Roadmap Evolution

- Phase 3 added: Parent child registration plus childcare center/class linking for stronger domain realism.
- Phase 4 added: Overdue-member management and childcare/class monthly Excel statement export for stronger CRM realism.

## Latest Verification Notes

- `npm run lint` passes after the `/children` member child-management surface was added.
- `npx vitest run "src/app/(member)/children/actions.test.ts" "src/app/(member)/children/child-form.test.tsx"` passes with auth, revalidation, search, scoped-class, edit, and discoverability coverage.
- `npm run lint` passes after the `03-03` admin CRM relationship changes.
- `npx vitest run "src/app/(admin)/admin/members/page.test.tsx"` passes with nested query and rendering coverage for parent, child, center, and class filters.
- `npm run lint` passes after adding the Phase 3 Vitest and Playwright harness.
- `npx vitest run --passWithNoTests` succeeds with the new `vitest.config.ts`.
- `npx playwright test --pass-with-no-tests --list` succeeds with the new `playwright.config.ts`.
- `supabase/migrations/006_parent_childcare_domain.sql` adds childcare centers, classes, and children without altering `generate_member_no`, `cms_billing_batches`, or `cms_billing_results`.
- A real `signUp` retry still fails with Supabase Auth error `over_email_send_rate_limit`.
- A service-role `auth.admin.createUser()` verification now confirms that auth user creation automatically produces a `cms_members` row with `member_no`.
- Two separate user-scoped `cms_members` inserts generated sequential `member_no` values: `MEM-202604-00004` and `MEM-202604-00005`.
- User-scoped delete on `cms_bank_accounts` succeeds and removes the row.
- Direct duplicate inserts into `cms_billing_batches` fail with Postgres error code `23505`, confirming the monthly batch unique constraint is active.
- Admin batch regression still passes:
  - unauthenticated `POST /api/billing/run` returns `401`
  - authenticated admin request returns `200`
  - admin results page returns `200`
- Supabase CLI migration history checks are still blocked because `SUPABASE_DB_PASSWORD` is not configured locally and direct CLI history queries hit the pooler circuit-breaker path.

## Remaining Blocker

- `MEM-01` is still open only because the public `signUp` path is currently rate-limited by Supabase Auth.

## Next Action

- Execute `03-04-PLAN.md` to add the Phase 3 smoke regression and automation hooks now that both childcare surfaces are committed.

## Decisions

- 2026-04-07 -- Established Vitest and Playwright runners in Wave 1 so all later Phase 3 plans can add tests without more infrastructure work.
- 2026-04-07 -- Modeled childcare data additively with `cms_children` linked to `cms_members` and `cms_childcare_classes`, leaving `member_no` and billing tables untouched.
- 2026-04-07 -- Protected `cms_children` with parent-owned RLS while exposing read-only authenticated policies for childcare centers and classes.
- 2026-04-08 -- Locked the admin members page to parent, child, center, and class filters while keeping legacy search as a parent-filter fallback.
- 2026-04-08 -- Used conditional `!inner` joins in the admin members query so relation filters narrow the parent result set instead of overfetching unrelated rows.
- 2026-04-08 -- Covered the async admin server page with direct Vitest rendering plus isolated query-helper tests to keep CRM regressions local to the route.
- [Phase 03-parent-childcare-domain]: Kept /children server-first and handed loaded child/center/class data to a single client leaf for interaction.
- [Phase 03-parent-childcare-domain]: Used search input plus existing buttons for center selection and the existing Select primitive for scoped class choice, avoiding a new combobox dependency.
- [Phase 03-parent-childcare-domain]: Added /children discoverability through both member navigation and a dashboard child summary card.

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files | Completed |
|-------|------|----------|-------|-------|-----------|
| 03-parent-childcare-domain | 01 | 25 min | 2 | 7 | 2026-04-07 |
| 03-parent-childcare-domain | 02 | 13 min | 2 | 7 | 2026-04-08 |
| 03-parent-childcare-domain | 03 | 8 min | 2 | 2 | 2026-04-08 |

## Session Info

- Last session: 2026-04-07T16:29:12.001Z
- Stopped At: Completed 03-02-PLAN.md
