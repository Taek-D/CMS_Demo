---
phase: 04
slug: overdue-statement-excel
status: revised
nyquist_compliant: true
wave_0_complete: true
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
| **Full suite command** | `npm run lint && npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" "src/app/(admin)/admin/overdue/export/route.test.ts" -x && npx playwright test tests/admin-overdue-export.spec.ts --project=chromium` |
| **Estimated runtime** | ~25 seconds for task-level fast feedback; longer only for the final Playwright phase gate |

---

## Sampling Rate

- **After Plan 01 or Plan 02 task commits:** Run `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" "src/app/(admin)/admin/overdue/export/route.test.ts" -x`
- **After Plan 03 Task 1:** Run `npm run lint && powershell -NoProfile -Command "Select-String -Path 'src/app/(admin)/layout.tsx','src/app/(admin)/admin/page.tsx','src/app/(admin)/admin/results/page.tsx' -Pattern 'Overdue','Overdue Management','results-overdue-link','/admin/overdue','status=failed'"`
- **After Plan 03 Task 2:** Run `npx playwright test tests/admin-overdue-export.spec.ts --project=chromium`
- **After every plan wave:** Run `npm run test:unit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 25 seconds for task-level checks; the Playwright run remains the slower final phase gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SC-04-01 | unit/server render | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" -x` | Created in task | ready |
| 04-01-02 | 01 | 1 | SC-04-02 | unit/helper + scoped export gating | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" -x` | Created in task | ready |
| 04-02-01 | 02 | 2 | SC-04-03 | route/workbook integration + explicit-scope rejection | `npx vitest run "src/app/(admin)/admin/overdue/export/route.test.ts" -x` | Created in task | ready |
| 04-02-02 | 02 | 2 | SC-04-04 | route parity + attachment behavior | `npx vitest run "src/app/(admin)/admin/overdue/export/route.test.ts" -x` | Created in task | ready |
| 04-03-01 | 03 | 3 | SC-04-03 | discoverability wiring | `npm run lint && powershell -NoProfile -Command "Select-String -Path 'src/app/(admin)/layout.tsx','src/app/(admin)/admin/page.tsx','src/app/(admin)/admin/results/page.tsx' -Pattern 'Overdue','Overdue Management','results-overdue-link','/admin/overdue','status=failed'"` | Existing files | ready |
| 04-03-02 | 03 | 3 | SC-04-04 | end-to-end smoke | `npx playwright test tests/admin-overdue-export.spec.ts --project=chromium` | Created in task | ready |

*Status: pending / green / red / warning*

---

## Wave 0 Requirements

No separate Wave 0 is required after revision. The fast-feedback path is embedded directly in the execution tasks:

- Plan 01 creates `src/app/(admin)/admin/overdue/page.test.tsx` before relying on overdue UI/helper verification.
- Plan 02 creates `src/app/(admin)/admin/overdue/export/route.test.ts` before relying on workbook or export-route verification.
- Plan 03 adds a focused wiring check for nav/dashboard/results discoverability before the Playwright end-to-end run.
- The export scope contract (`month`, `center`, and `class` required) is enforced by automated tests instead of manual reviewer interpretation.

---

## Manual-Only Verifications

None required for Nyquist compliance. Optional product review can still inspect one generated XLSX for presentation quality, but scope correctness and discoverability are covered by automated checks.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify steps or Wave 0 dependencies
- [x] All tasks have `<automated>` verify steps or same-task test creation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 replacement fast-path is explicit and complete
- [x] No watch-mode flags
- [x] Feedback latency < 30s for task-level fast checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** revised-fast-path-ready
