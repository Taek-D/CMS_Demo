# Testing Patterns

**Analysis Date:** 2026-04-06

## Test Framework

**Runner:**
- Not detected.
- Config: Not detected. No `jest.config.*`, `vitest.config.*`, Playwright config, or project-owned `*.test.*` / `*.spec.*` files are present outside `node_modules`.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
npm run lint           # Current automated quality gate
npm run test           # Fails: Missing script "test"
npm run build          # Available app-level verification, but not a test runner
```

## Test File Organization

**Location:**
- Not detected. There is no repo-owned `tests/`, `e2e/`, or co-located `*.test.*` / `*.spec.*` file under `src/`.

**Naming:**
- Not applicable until a test framework is introduced.

**Structure:**
```text
No project test directory or co-located test files detected.
Only application code exists under `src/`.
```

## Test Structure

**Suite Organization:**
```typescript
// Not detected.
// No describe/it/test blocks exist in repo-owned source files.
```

**Patterns:**
- Setup pattern: Not detected.
- Teardown pattern: Not detected.
- Assertion pattern: Not detected.

## Mocking

**Framework:** Not detected.

**Patterns:**
```typescript
// Not detected.
// No mocking utilities or stubs are defined in repo-owned code.
```

**What to Mock:**
- No current policy is implemented because there is no test framework.

**What NOT to Mock:**
- No current policy is implemented because there is no test framework.

## Fixtures and Factories

**Test Data:**
```typescript
// Not detected.
// No fixtures, factories, builders, or seed helpers are stored for tests.
```

**Location:**
- Not detected.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
# Not available. No coverage command or reporter is configured in `package.json`.
```

## Test Types

**Unit Tests:**
- Not used.
- Pure helpers are untested, including `src/lib/crypto.ts`, `src/lib/utils.ts`, and status-display helper branches embedded in `src/app/(member)/account/account-display.tsx`, `src/app/(member)/consent/consent-card.tsx`, `src/app/(member)/dashboard/page.tsx`, and `src/app/(member)/payments/page.tsx`.

**Integration Tests:**
- Not used.
- Server mutations and route handlers are untested: `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`, `src/app/(member)/actions.ts`, `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`, `src/lib/supabase/middleware.ts`.

**E2E Tests:**
- Not used.
- No Playwright, Cypress, or browser automation test package is listed in `package.json`.

## Current Verification Workflow

- Manual verification is documented in `README.md`, not encoded as automated tests.
- The checklist in `README.md` covers the core member flow, admin billing run, encrypted account handling, duplicate batch prevention, and failed-payment filtering.
- Day-to-day regression detection currently depends on `npm run lint`, `npm run build`, and manual browser checks via `npm run dev`.

## Current Automation Baseline

- `npm run lint` is the only repository-owned automated check in `package.json`.
- As of 2026-04-06, `npm run lint` fails with 13 errors and 1 warning.
- The failures are concentrated in `@typescript-eslint/no-explicit-any` across client forms, client cards, admin pages, and API routes:
  `src/components/auth/login-form.tsx`,
  `src/components/auth/signup-form.tsx`,
  `src/app/(member)/account/account-form.tsx`,
  `src/app/(member)/account/account-display.tsx`,
  `src/app/(member)/consent/consent-card.tsx`,
  `src/app/(admin)/admin/billing/billing-run-card.tsx`,
  `src/app/(admin)/admin/results/page.tsx`,
  `src/app/api/billing/run/route.ts`,
  `src/app/api/webhook/cms/route.ts`.
- Additional lint findings are in `src/lib/supabase/middleware.ts` for `prefer-const` and an unused `user` variable.

## Common Patterns

**Async Testing:**
```typescript
// Not detected in tests.
// Async behavior exists only in production code today, for example:
const result = await registerAccount(form);
if (result.success) {
  router.refresh();
}
```

**Error Testing:**
```typescript
// Not detected in tests.
// Error branches are implemented in production code via:
return { success: false, error: '...' };
return NextResponse.json({ error: '...' }, { status: 400 });
```

## High-Risk Gaps

- Auth flow coverage is missing for `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`, `src/lib/auth.ts`, and `src/lib/admin-auth.ts`.
- Financial mutation coverage is missing for `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`, `src/app/api/billing/run/route.ts`, and `src/app/api/webhook/cms/route.ts`.
- Encryption and masking behavior in `src/lib/crypto.ts` is untested despite being security-sensitive and reused in member/admin screens.
- Session refresh behavior in `src/middleware.ts` and `src/lib/supabase/middleware.ts` has no regression protection.
- Admin reporting pages in `src/app/(admin)/admin/members/page.tsx` and `src/app/(admin)/admin/results/page.tsx` transform decrypted data inline without any automated verification.

---

*Testing analysis: 2026-04-06*
