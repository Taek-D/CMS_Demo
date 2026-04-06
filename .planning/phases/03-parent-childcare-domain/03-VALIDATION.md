---
phase: 03
slug: parent-childcare-domain
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + Testing Library + Playwright |
| **Config file** | `vitest.config.ts` and `playwright.config.ts` (Wave 0 installs) |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npx vitest run`
- **Before `$gsd-verify-work`:** Full suite must be green via `npx vitest run && npx playwright test`
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-W0-01 | 01 | 0 | P3-01 | infra | `npm run lint` | no | pending |
| 03-W1-01 | 01 | 1 | P3-01 | integration | `npx vitest run src/app/(member)/children/actions.test.ts` | no | pending |
| 03-W1-02 | 02 | 1 | P3-02 | component | `npx vitest run src/app/(member)/children/child-form.test.tsx` | no | pending |
| 03-W2-01 | 03 | 2 | P3-03 | integration | `npx vitest run src/app/(admin)/admin/members/page.test.tsx` | no | pending |
| 03-W2-02 | 03 | 2 | P3-04 | e2e smoke | `npx playwright test tests/member-billing-smoke.spec.ts` | no | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` - App Router-compatible Vitest configuration
- [ ] `playwright.config.ts` - smoke-test runner configuration
- [ ] `src/app/(member)/children/actions.test.ts` - parent-owned child CRUD verification
- [ ] `src/app/(member)/children/child-form.test.tsx` - center/class scoped selection verification
- [ ] `src/app/(admin)/admin/members/page.test.tsx` - admin relationship projection verification
- [ ] `tests/member-billing-smoke.spec.ts` - regression coverage for current member and billing flow
- [ ] `npm install -D vitest jsdom @vitejs/plugin-react @testing-library/react @playwright/test` - testing stack install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Childcare center/class realism review | P3-02 | Seed data quality and UX credibility are product-facing and easiest to validate visually | Create 2-3 childcare centers with multiple classes, open the parent child-management page, confirm center search narrows the class choices to the selected center only. |
| Admin relationship readability | P3-03 | The portfolio value depends on whether the CRM view reads clearly to a client | Open the admin members page, search by parent name and child name, and confirm the relationship columns are understandable without opening another screen. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing verification files
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
