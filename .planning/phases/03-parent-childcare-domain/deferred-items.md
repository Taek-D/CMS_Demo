# Deferred Items

## 2026-04-08

- Out-of-scope dirty-worktree mismatch: `npx vitest run "src/app/(member)/children/actions.test.ts" "src/app/(member)/children/child-form.test.tsx" "src/app/(admin)/admin/members/page.test.tsx"` fails in `src/app/(member)/children/child-form.test.tsx` because the current workspace version of [`src/app/(member)/children/child-form.tsx`](E:\프로젝트\위시켓\CMS Auto-Debit Demo — 효성CMS 자동이체 플로우 재현 시스템\cms-auto-debit-demo\src\app\(member)\children\child-form.tsx) no longer exposes the `data-testid="class-select-trigger"` selector that the existing tests expect. This was not modified in Task 2, so it was logged instead of auto-fixed.
