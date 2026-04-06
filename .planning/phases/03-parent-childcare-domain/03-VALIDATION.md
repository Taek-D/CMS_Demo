---
phase: 03
slug: parent-childcare-domain
status: aligned
nyquist_compliant: true
plan_count: 4
wave_count: 3
created: 2026-04-06
updated: 2026-04-07
---

# Phase 03 - Validation Strategy

> Per-phase validation contract aligned to the current 4-plan / 3-wave execution design.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + Testing Library + Playwright |
| **Config file** | `vitest.config.ts` and `playwright.config.ts` (created in Plan `03-01`) |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npx vitest run src/app/(member)/children/actions.test.ts src/app/(member)/children/child-form.test.tsx src/app/(admin)/admin/members/page.test.tsx && npx playwright test tests/member-billing-smoke.spec.ts` |
| **Estimated runtime** | ~90-120 seconds |

---

## Wave Sampling

- **After every task commit:** Run `npm run lint`
- **After Wave 1:** Run `npx vitest run --passWithNoTests && npx playwright test --pass-with-no-tests --list`
- **After Wave 2:** Run `npx vitest run src/app/(member)/children/actions.test.ts src/app/(member)/children/child-form.test.tsx src/app/(admin)/admin/members/page.test.tsx`
- **Before `$gsd-verify-work`:** Full suite must be green via `npx vitest run src/app/(member)/children/actions.test.ts src/app/(member)/children/child-form.test.tsx src/app/(admin)/admin/members/page.test.tsx && npx playwright test tests/member-billing-smoke.spec.ts`
- **Max feedback latency target:** 120 seconds

---

## Wave Structure

| Wave | Plans | Validation Focus |
|------|-------|------------------|
| 1 | `03-01` | Test harness, schema contract, typed foundation |
| 2 | `03-02`, `03-03` | Member child flow and admin CRM coverage |
| 3 | `03-04` | Stable selectors and end-to-end regression smoke |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Primary Files | Status |
|---------|------|------|-------------|-----------|-------------------|---------------|--------|
| `03-01-T1` | `03-01` | 1 | `P3-04` | infra | `npm install && npm run lint && npx vitest run --passWithNoTests && npx playwright test --pass-with-no-tests --list` | `package.json`, `package-lock.json`, `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts` | pending |
| `03-01-T2` | `03-01` | 1 | `P3-04` | schema + types | `npm run lint && rg -n "create table cms_childcare_centers|create table cms_childcare_classes|create table cms_children" supabase/migrations/006_parent_childcare_domain.sql && rg -n "Morning Star Childcare|River Kids Center|Sun Class|Moon Class|Star Class" supabase/migrations/006_parent_childcare_domain.sql && rg -n "export interface ChildcareCenter|export interface ChildcareClass|export interface Child" src/types/database.ts && rg -n "generate_member_no|cms_billing_batches|cms_billing_results" supabase/migrations/001_initial_schema.sql` | `supabase/migrations/006_parent_childcare_domain.sql`, `src/types/database.ts` | pending |
| `03-02-T1` | `03-02` | 2 | `P3-01` | integration | `npm run lint && npx vitest run src/app/(member)/children/actions.test.ts` | `src/app/(member)/children/page.tsx`, `src/app/(member)/children/actions.ts`, `src/app/(member)/children/actions.test.ts` | pending |
| `03-02-T2` | `03-02` | 2 | `P3-02` | component | `npm run lint && npx vitest run src/app/(member)/children/child-form.test.tsx` | `src/app/(member)/children/child-form.tsx`, `src/app/(member)/children/page.tsx`, `src/app/(member)/layout.tsx`, `src/app/(member)/dashboard/page.tsx`, `src/app/(member)/children/child-form.test.tsx` | pending |
| `03-03-T1` | `03-03` | 2 | `P3-03` | integration | `npm run lint && npx vitest run src/app/(admin)/admin/members/page.test.tsx` | `src/app/(admin)/admin/members/page.tsx`, `src/app/(admin)/admin/members/page.test.tsx` | pending |
| `03-03-T2` | `03-03` | 2 | `P3-03` | integration | `npm run lint && npx vitest run src/app/(admin)/admin/members/page.test.tsx` | `src/app/(admin)/admin/members/page.tsx`, `src/app/(admin)/admin/members/page.test.tsx` | pending |
| `03-04-T1` | `03-04` | 3 | `P3-04` | automation hooks | `npm run lint && rg -n "data-testid" src/app/(member)/children/page.tsx src/app/(member)/children/child-form.tsx src/app/(admin)/admin/members/page.tsx` | `src/app/(member)/children/page.tsx`, `src/app/(member)/children/child-form.tsx`, `src/app/(admin)/admin/members/page.tsx` | pending |
| `03-04-T2` | `03-04` | 3 | `P3-04` | e2e smoke | `npm run lint && npx playwright test tests/member-billing-smoke.spec.ts` | `tests/member-billing-smoke.spec.ts` | pending |

*Status values: `pending`, `green`, `red`, `flaky`*

---

## Plan-Level Verification Notes

- `tests/member-billing-smoke.spec.ts` is created and owned by Plan `03-04` and should stay Playwright-only. Do not run it through Vitest.
- The three colocated `*.test.ts` / `*.test.tsx` files are created in Plans `03-02` and `03-03`, remain Vitest-owned, and should stay out of Playwright commands.
- Plan `03-01` is the only plan allowed to add test infrastructure dependencies and lockfile changes.
- Plan `03-04` creates the Playwright spec and turns it into the real end-to-end regression path.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Childcare center/class realism review | `P3-02` | The product sell depends on whether the center-first flow feels believable, not just technically valid | Sign in as a parent, open `/children`, search for a center, select it, and confirm only that center's classes appear before saving a child. |
| Admin relationship readability | `P3-03` | The CRM needs to read clearly to a client reviewer, not just return correct rows | Open `/admin/members`, filter by parent and child, and confirm child count plus center/class columns are understandable without leaving the page. |

---

## Validation Sign-Off

- [x] All 4 plans and all 8 tasks have an `<automated>` verification command.
- [x] Validation waves match the current plan frontmatter: `03-01` -> wave 1, `03-02`/`03-03` -> wave 2, `03-04` -> wave 3.
- [x] Playwright ownership is isolated to `tests/member-billing-smoke.spec.ts`.
- [x] No Wave 0 placeholder remains in the Phase 3 validation contract.
- [x] No watch-mode command is required for planned verification.
- [x] `nyquist_compliant: true` is now accurate for the current plan set.

**Approval:** pending
