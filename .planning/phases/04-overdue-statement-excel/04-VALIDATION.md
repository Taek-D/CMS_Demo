---
phase: 04
slug: overdue-statement-excel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 04 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 + Playwright 1.59.1 |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" "src/app/(admin)/admin/overdue/export/route.test.ts" -x` |
| **Full suite command** | `npm run test:unit && npx playwright test tests/admin-overdue-export.spec.ts --project=chromium` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" "src/app/(admin)/admin/overdue/export/route.test.ts" -x`
- **After every plan wave:** Run `npm run test:unit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SC-04-01 | unit/server render | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" -x` | No - Wave 0 | pending |
| 04-01-02 | 01 | 1 | SC-04-02 | unit/helper | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" -x` | No - Wave 0 | pending |
| 04-02-01 | 02 | 2 | SC-04-03 | route/workbook integration | `npx vitest run "src/app/(admin)/admin/overdue/export/route.test.ts" -x` | No - Wave 0 | pending |
| 04-03-01 | 03 | 3 | SC-04-04 | end-to-end smoke | `npx playwright test tests/admin-overdue-export.spec.ts --project=chromium` | No - Wave 0 | pending |

*Status: pending / green / red / warning*

---

## Wave 0 Requirements

- [ ] `src/app/(admin)/admin/overdue/page.test.tsx` - stubs/coverage for overdue page rendering and filter behavior
- [ ] `src/app/(admin)/admin/overdue/export/route.test.ts` - response headers, workbook columns, and filter scoping coverage
- [ ] `tests/admin-overdue-export.spec.ts` - end-to-end admin overdue/export regression
- [ ] Shared deterministic billing seed helper reuse or extraction if execution would otherwise duplicate smoke setup logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portfolio acceptability of member-level money rows with aggregated child/class labels | SC-04-03, SC-04-04 | Current schema is member-scoped, so export semantics need product judgment as well as technical correctness | Review one generated XLSX and confirm that one billing result per member row with aggregated child/class labels is acceptable for v1 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify steps or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
