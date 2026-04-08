---
phase: 04-overdue-statement-excel
plan: "03"
subsystem: testing
tags: [nextjs, playwright, admin, overdue, xlsx, supabase]
requires:
  - phase: 04-overdue-statement-excel
    provides: dedicated overdue page and export route for failed billing rows
provides:
  - admin-shell overdue discoverability
  - batch-results handoff into overdue filters
  - deterministic Playwright proof for overdue export download
affects: [admin-ui, billing-results, overdue-export, verification]
tech-stack:
  added: []
  patterns: [server-rendered admin CTA handoff, service-role Playwright seeding, real download assertion]
key-files:
  created: [tests/admin-overdue-export.spec.ts]
  modified:
    [
      src/app/(admin)/layout.tsx,
      src/app/(admin)/admin/page.tsx,
      src/app/(admin)/admin/results/page.tsx,
      src/app/(admin)/admin/overdue/page.tsx,
    ]
key-decisions:
  - "Kept overdue discoverability additive by linking into /admin/overdue instead of merging overdue data into existing admin pages."
  - "Seeded the Phase 4 regression with fixed month, center, class, amount, and fail reason values so the browser proof remains deterministic on the linked Supabase environment."
patterns-established:
  - "Results-to-feature handoff: use explicit CTA links from existing admin surfaces into dedicated CRM routes with preserved query context."
  - "Playwright proof pattern: seed deterministic admin/member billing data through the service-role client, then assert a real browser download filename."
requirements-completed: [SC-04-03, SC-04-04]
duration: 32min
completed: 2026-04-08
---

# Phase 04 Plan 03: Overdue Discoverability and Proof Summary

**Admin overdue discoverability wired into navigation, dashboard, and billing results with a deterministic Playwright proof of month-plus-center-plus-class XLSX export**

## Performance

- **Duration:** 32 min
- **Started:** 2026-04-08T17:57:00+09:00
- **Completed:** 2026-04-08T18:28:58+09:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added an `Overdue` entry to the admin shell and an `Overdue Management` quick action to the admin dashboard.
- Added a `results-overdue-link` CTA on the billing results page that preserves the selected batch month and hands off into `/admin/overdue?status=failed`.
- Added a deterministic Playwright regression that seeds a failed `2026-04` billing path, scopes the overdue flow by month, center, and class, and asserts the real XLSX download filename.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add overdue discoverability to the admin shell, dashboard, and results flow** - `9232d59` (feat)
2. **Task 2: Add a deterministic Playwright regression for results-to-overdue export** - `3ce8795` (test)

## Files Created/Modified

- `src/app/(admin)/layout.tsx` - Adds the admin-shell `Overdue` navigation entry.
- `src/app/(admin)/admin/page.tsx` - Adds the dashboard quick action for overdue management while preserving the current admin landing page.
- `src/app/(admin)/admin/results/page.tsx` - Adds the batch-aware overdue CTA with `results-overdue-link`.
- `src/app/(admin)/admin/overdue/page.tsx` - Fixes query-string serialization typing so the overdue page builds cleanly for the Playwright run.
- `tests/admin-overdue-export.spec.ts` - Seeds the failed billing scenario and proves the full results-to-overdue-to-download browser flow.

## Decisions Made

- Kept the results page as a discoverability handoff only; the overdue table stays on `/admin/overdue` per the dedicated-route constraint.
- Used the same service-role seeding approach as the Phase 3 smoke test so the new browser proof remains self-contained and repeatable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed overdue query-string serialization typing**
- **Found during:** Task 2 (Add a deterministic Playwright regression for results-to-overdue export)
- **Issue:** `src/app/(admin)/admin/overdue/page.tsx` built a readonly tuple array for `URLSearchParams`, which caused `next build` type checking to fail and blocked the Playwright web server from starting.
- **Fix:** Replaced the readonly tuple `flatMap` construction with an explicitly mutable `Array<[string, string]>` builder before calling `new URLSearchParams(entries)`.
- **Files modified:** `src/app/(admin)/admin/overdue/page.tsx`
- **Verification:** `npx playwright test tests/admin-overdue-export.spec.ts --project=chromium`
- **Committed in:** `3ce8795` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for the existing overdue page to build under Next.js type checking. No scope creep beyond unblocking the planned Playwright proof.

## Issues Encountered

- The first Task 1 commit attempt raced `git add` and `git commit` under parallel execution. Restaging sequentially resolved it without affecting scoped files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 now has both discoverability and end-to-end proof for the strongest overdue export story.
- Ready for final verification/closeout on the completed overdue-management milestone work.

## Self-Check: PASSED

- Verified summary, discoverability files, overdue page, and Playwright spec all exist on disk.
- Verified task commits `9232d59` and `3ce8795` exist in git history.
- No placeholder or stub markers were found in the files touched by this plan.

---

*Phase: 04-overdue-statement-excel*
*Completed: 2026-04-08*
