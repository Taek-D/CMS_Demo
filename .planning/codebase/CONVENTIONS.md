# Coding Conventions

**Analysis Date:** 2026-04-06

## Naming Patterns

**Files:**
- Use Next.js App Router reserved names for route entry files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/(member)/account/page.tsx`, `src/app/api/billing/run/route.ts`.
- Use kebab-case for feature-local components and helpers: `src/app/(member)/account/account-form.tsx`, `src/app/(member)/consent/consent-card.tsx`, `src/app/(admin)/admin/billing/billing-run-card.tsx`.
- Keep server actions in a sibling `actions.ts` file when a route segment needs mutations: `src/app/(member)/actions.ts`, `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`.
- Keep shared libraries in short lower-case files under `src/lib/`: `src/lib/auth.ts`, `src/lib/admin-auth.ts`, `src/lib/crypto.ts`, `src/lib/utils.ts`.

**Functions:**
- Name React components in PascalCase and export them as the default export from the file: `HomePage`, `AccountPage`, `LoginForm`, `BillingRunCard`.
- Name non-component functions in camelCase with verb-first names: `requireAuth`, `getCurrentUser`, `createClient`, `registerAccount`, `giveConsent`, `updateSession`.
- Use `handle...` for client event handlers and `get...` for display helpers: `handleSubmit`, `handleDelete`, `handleRunBilling`, `getStatusBadge`, `getPaymentStatusBadge`.

**Variables:**
- Use camelCase for local variables and state: `currentMonth`, `statusFilter`, `existingBatch`, `decryptedAccountNumber`, `loading`, `error`, `success`.
- Keep form field names and database-facing payload keys in snake_case when they map directly to Supabase columns or `FormData`: `bank_code`, `account_number`, `account_holder`, `batch_month`, `fail_reason`.
- Prefer descriptive booleans and nullable UI state over short names: `isSuccess`, `currentStatus`, `selectedBatch`, `recentPayments`.

**Types:**
- Define component prop contracts inline with `interface ...Props` near the component: `ConsentProps` in `src/app/(member)/consent/consent-card.tsx`, `AccountDisplayProps` in `src/app/(member)/account/account-display.tsx`.
- Keep reusable domain types in `src/types/database.ts`, but note that current feature code does not import them.
- Narrow string unions inline for UI state and status fields: `'pending' | 'consented' | 'revoked'`, `'pending' | 'success' | 'failed'`.

## Code Style

**Formatting:**
- App code under `src/app/`, `src/components/auth/`, and `src/lib/` is written with single quotes and semicolons. Follow that style when editing those files: `src/lib/auth.ts`, `src/app/(member)/account/actions.ts`.
- Generated shadcn/base-ui primitives under `src/components/ui/` use double quotes and omit semicolons: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/table.tsx`.
- Preserve the local style of the file you are touching instead of normalizing the entire repo in one pass.

**Linting:**
- Use ESLint 9 via `eslint.config.mjs` with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Respect the active TypeScript-focused lint rules. `npm run lint` currently fails on `@typescript-eslint/no-explicit-any`, `prefer-const`, and `@typescript-eslint/no-unused-vars`.
- When touching files with `catch (err: any)` or `let ...` placeholders, tighten them to satisfy lint instead of adding new exceptions.

## Import Organization

**Order:**
1. Framework and external packages first: `react`, `next/navigation`, `@supabase/ssr`, `@base-ui/react/...`.
2. Aliased internal imports from `@/` next: `@/lib/auth`, `@/components/ui/button`, `@/lib/supabase/server`.
3. Relative sibling imports last: `./actions`, `./account-form`, `./billing-run-card`.

**Path Aliases:**
- Use the `@/*` alias from `tsconfig.json` for cross-feature imports.
- Use relative imports only for same-directory collaborators inside a route segment: `src/app/(member)/account/page.tsx` imports `./account-form` and `./account-display`.

## Next.js Component Boundaries

**Server Components:**
- Keep `page.tsx` and `layout.tsx` as server components by default. Current route entries fetch Supabase data directly and do not declare `'use client'`: `src/app/page.tsx`, `src/app/(member)/dashboard/page.tsx`, `src/app/(admin)/admin/results/page.tsx`.
- Make server route entries `async` when they read auth state or query Supabase.

**Client Components:**
- Add `'use client';` only to interactive components that need hooks, browser APIs, `fetch`, `confirm`, or router mutation methods: `src/components/auth/login-form.tsx`, `src/app/(member)/account/account-form.tsx`, `src/app/(admin)/admin/billing/billing-run-card.tsx`.
- Keep client components focused on UI state, submit handlers, and optimistic refreshes. Data loading still happens in the parent server page.

## Error Handling

**Patterns:**
- In client components, track `loading`, `error`, and optional `success` with `useState`, then render feedback through `Alert` and `AlertDescription`: `src/components/auth/login-form.tsx`, `src/app/(member)/consent/consent-card.tsx`, `src/app/(admin)/admin/billing/billing-run-card.tsx`.
- In server actions, return small result objects instead of throwing for expected failures:

```ts
if (!user) {
  return { success: false, error: 'Login required' };
}

return { success: true };
```

- In API routes, validate request data early and respond with `NextResponse.json(..., { status })`: `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`.
- Reserve `console.error(...)` for server-side failure paths in route handlers. Current logging is limited to `src/app/api/billing/run/route.ts` and `src/app/api/webhook/cms/route.ts`.

## Logging

**Framework:** `console`

**Patterns:**
- Do not log from client components.
- Log unexpected server failures with a context prefix, for example `console.error('Billing run error:', error)` in `src/app/api/billing/run/route.ts`.

## Comments

**When to Comment:**
- Keep comments sparse and practical. Existing comments mostly mark logical sections or warn about framework gotchas, such as the Supabase middleware note in `src/lib/supabase/middleware.ts`.
- Use section comments inside long server pages to separate query blocks and UI sections, as seen in `src/app/(member)/dashboard/page.tsx` and `src/app/(admin)/admin/results/page.tsx`.

**JSDoc/TSDoc:**
- JSDoc is rare. It is currently used only for crypto helpers in `src/lib/crypto.ts`.
- Do not add blanket documentation to every component. Add JSDoc only for non-trivial reusable helpers.

## Function Design

**Size:** Keep helpers small and feature-local. Most action helpers stay within one responsibility, for example `logout`, `giveConsent`, `deleteAccount`.

**Parameters:** Prefer primitives or `FormData` for mutations. `registerAccount(formData: FormData)` reads named fields from the form payload; route handlers accept `NextRequest`.

**Return Values:** Use one of three current patterns:
- Redirect for auth guards: `requireAuth()` and `requireAdmin()` in `src/lib/auth.ts` and `src/lib/admin-auth.ts`.
- `{ success, error? }` objects for server actions: `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`.
- `NextResponse.json(...)` payloads for API routes: `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`.

## Forms and Actions

**Current Form Pattern:**
- Interactive forms are controlled client components using `useState`, `handleChange`, and `handleSubmit`: `src/components/auth/signup-form.tsx`, `src/app/(member)/account/account-form.tsx`.
- Feature mutations live in adjacent server action files and are imported directly into the client component.
- Auth logout uses the native server action form pattern instead of a client click handler:

```tsx
<form action={logout}>
  <button type="submit">Logout</button>
</form>
```

- Member account registration uses explicit `FormData` construction in the client component before calling the server action:

```ts
const form = new FormData();
form.append('bank_code', formData.bank_code);
const result = await registerAccount(form);
```

- Current code does not use `useActionState`, `useFormStatus`, `react-hook-form`, or schema validators.

## Module Design

**Exports:** Use default exports for page and component modules. Use named exports for utilities and server actions: `createClient`, `requireAuth`, `buttonVariants`, `logout`.

**Barrel Files:** Not detected. Import modules directly from their source file paths.

## Type Safety Notes

- `tsconfig.json` enables `strict: true`, but the codebase still carries lint-breaking `any` usage in `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`, `src/app/(member)/account/account-form.tsx`, `src/app/(member)/account/account-display.tsx`, `src/app/(member)/consent/consent-card.tsx`, `src/app/(admin)/admin/billing/billing-run-card.tsx`, `src/app/(admin)/admin/results/page.tsx`, `src/app/api/billing/run/route.ts`, and `src/app/api/webhook/cms/route.ts`.
- Prefer importing or extracting concrete types when editing those files instead of extending the `any` pattern.

---

*Convention analysis: 2026-04-06*
