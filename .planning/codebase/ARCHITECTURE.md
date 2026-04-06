# Architecture

**Analysis Date:** 2026-04-06

## Pattern Overview

**Overall:** Next.js App Router monolith with route-grouped UI surfaces, Supabase-backed auth/data access, and feature-local mutations.

**Key Characteristics:**
- Use route groups under `src/app` to separate public auth, member, and admin surfaces without splitting the deployment.
- Keep read logic in async Server Components such as `src/app/(member)/dashboard/page.tsx` and `src/app/(admin)/admin/results/page.tsx`.
- Keep mutations close to the feature using either Server Actions like `src/app/(member)/account/actions.ts` or API routes like `src/app/api/billing/run/route.ts`.

## Layers

**Routing and Composition Layer:**
- Purpose: Define pages, route groups, layouts, and API endpoints.
- Location: `src/app`, `src/middleware.ts`
- Contains: `layout.tsx`, `page.tsx`, feature-local client components, `route.ts`, and `actions.ts`.
- Depends on: `src/lib/*`, `src/components/*`, `src/types/database.ts`
- Used by: Next.js runtime.

**Feature UI Layer:**
- Purpose: Render auth forms, account management UI, consent UI, and admin tools.
- Location: `src/components/auth`, feature-local client components inside `src/app/(member)/*` and `src/app/(admin)/admin/billing`
- Contains: Client components such as `src/components/auth/login-form.tsx`, `src/app/(member)/account/account-form.tsx`, `src/app/(member)/consent/consent-card.tsx`, `src/app/(admin)/admin/billing/billing-run-card.tsx`
- Depends on: `src/components/ui/*`, `src/lib/*`, Next client hooks.
- Used by: Page components in `src/app`.

**Shared UI Primitive Layer:**
- Purpose: Provide reusable presentational primitives for cards, buttons, alerts, badges, inputs, tables, and dialogs.
- Location: `src/components/ui`
- Contains: `button.tsx`, `card.tsx`, `table.tsx`, `alert.tsx`, `badge.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `select.tsx`
- Depends on: `src/lib/utils.ts`, shadcn/base-nova patterns configured in `components.json`
- Used by: Auth components and page-local feature components.

**Authentication and Access Control Layer:**
- Purpose: Resolve the current Supabase user and gate route groups by role.
- Location: `src/lib/auth.ts`, `src/lib/admin-auth.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`
- Contains: `requireAuth()`, `getCurrentUser()`, `requireAdmin()`, and session refresh middleware.
- Depends on: `src/lib/supabase/server.ts`, `next/navigation`, `@supabase/ssr`
- Used by: `src/app/page.tsx`, `src/app/(member)/layout.tsx`, `src/app/(admin)/layout.tsx`, admin/member pages.

**Data Access Layer:**
- Purpose: Create Supabase clients for server, browser, and service-role access.
- Location: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`
- Contains: `createClient()`, `createServiceClient()`, browser client factory, and cookie sync logic.
- Depends on: Supabase env vars and `cookies()` from Next headers.
- Used by: All pages, Server Actions, middleware, and API routes.

**Domain Utility Layer:**
- Purpose: Centralize domain-specific helpers that are reused across member and admin flows.
- Location: `src/lib/crypto.ts`, `src/lib/constants.ts`, `src/types/database.ts`
- Contains: AES account encryption/decryption/masking, bank code lookup data, and domain interfaces.
- Depends on: Node `crypto` and environment configuration.
- Used by: Member account pages, admin listings, and batch result views.

**Persistence Layer:**
- Purpose: Define relational schema, RLS policies, triggers, and indexes.
- Location: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_additional_rls_policies.sql`
- Contains: Tables `cms_members`, `cms_bank_accounts`, `cms_billing_schedules`, `cms_billing_batches`, `cms_billing_results`
- Depends on: Supabase Postgres.
- Used by: Supabase queries throughout `src/app` and `src/lib`.

## Data Flow

**Authentication and Route Resolution:**

1. `src/middleware.ts` runs on most requests and delegates to `updateSession()` in `src/lib/supabase/middleware.ts` to refresh Supabase cookies.
2. `src/app/page.tsx` calls `getCurrentUser()` from `src/lib/auth.ts` and redirects anonymous users to `/login` and signed-in users to `/dashboard`.
3. Group layouts `src/app/(member)/layout.tsx` and `src/app/(admin)/layout.tsx` call `requireAuth()` or `requireAdmin()` before rendering navigation and children.

**Member Read Flow:**

1. A member page such as `src/app/(member)/dashboard/page.tsx` calls `requireAuth()` and creates a server Supabase client.
2. The page queries tables directly with `.from(...).select(...)` against `cms_members`, `cms_bank_accounts`, and `cms_billing_results`.
3. The page renders mostly server-side HTML and passes fetched records into small client leaves only when interaction is needed.

**Member Mutation Flow:**

1. Client components such as `src/app/(member)/account/account-form.tsx` and `src/app/(member)/consent/consent-card.tsx` collect user input.
2. They call feature-local Server Actions in `src/app/(member)/account/actions.ts` or `src/app/(member)/consent/actions.ts`.
3. Actions create a server Supabase client, resolve the current user, mutate rows, call `revalidatePath()`, and return `{ success, error }` objects for the client to interpret.

**Admin Batch Flow:**

1. `src/app/(admin)/admin/billing/billing-run-card.tsx` runs in the browser and POSTs JSON to `src/app/api/billing/run/route.ts`.
2. The route uses `createServiceClient()` from `src/lib/supabase/server.ts` to bypass member RLS for batch work.
3. The route reads active schedules with consented accounts, inserts a row into `cms_billing_batches`, creates `cms_billing_results` rows, updates counts, and returns a batch summary.
4. Admin result pages such as `src/app/(admin)/admin/results/page.tsx` read batch/result data and apply masking after decrypting account numbers.

**Webhook Update Flow:**

1. External or simulated callback traffic POSTs to `src/app/api/webhook/cms/route.ts`.
2. The handler validates payload shape, updates a row in `cms_billing_results`, and returns JSON.
3. Trigger `update_batch_counts_trigger` in `supabase/migrations/002_additional_rls_policies.sql` recalculates counters on `cms_billing_batches`.

**State Management:**
- Prefer server state over client state. Pages fetch from Supabase on the server and re-render through `router.refresh()` or `revalidatePath()`.
- Use local `useState` only for form status, loading flags, transient errors, and confirmation UI inside client leaves.
- There is no global client state store. Shared state is the database plus Supabase auth session cookies.

## Key Abstractions

**Route Groups as Product Surfaces:**
- Purpose: Keep auth, member, and admin flows separate without different apps.
- Examples: `src/app/(auth)`, `src/app/(member)`, `src/app/(admin)`
- Pattern: Group-level layout guards plus feature-local pages.

**Server Client vs Service Client:**
- Purpose: Differentiate RLS-respecting user operations from privileged back-office operations.
- Examples: `createClient()` and `createServiceClient()` in `src/lib/supabase/server.ts`
- Pattern: Use `createClient()` in member pages/actions and `createServiceClient()` in admin list pages or API routes that need full-table access.

**Feature-Local Actions:**
- Purpose: Keep mutation code next to the page it supports.
- Examples: `src/app/(member)/actions.ts`, `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`
- Pattern: Export async server functions with `'use server'`, return lightweight success/error payloads, and revalidate affected routes.

**Leaf Client Components:**
- Purpose: Isolate browser-only interactivity while keeping most rendering server-side.
- Examples: `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`, `src/app/(member)/account/account-display.tsx`, `src/app/(admin)/admin/billing/billing-run-card.tsx`
- Pattern: The page owns data loading; the client component owns input, `fetch`, `router.push`, and `router.refresh`.

**Database-First Domain Model:**
- Purpose: Encode domain entities as tables/interfaces rather than custom repositories.
- Examples: `src/types/database.ts`, `supabase/migrations/001_initial_schema.sql`
- Pattern: Query table names directly from pages/actions and keep interfaces aligned with migration columns.

## Entry Points

**Root redirect entry:**
- Location: `src/app/page.tsx`
- Triggers: Request to `/`
- Responsibilities: Determine whether to redirect to `/login` or `/dashboard`.

**Root layout entry:**
- Location: `src/app/layout.tsx`
- Triggers: Every app route
- Responsibilities: Load global fonts, import `src/app/globals.css`, and wrap the HTML/body shell.

**Member shell entry:**
- Location: `src/app/(member)/layout.tsx`
- Triggers: `/dashboard`, `/account`, `/consent`, `/payments`
- Responsibilities: Enforce authentication, fetch member summary for the header, wire logout action, and render member navigation.

**Admin shell entry:**
- Location: `src/app/(admin)/layout.tsx`
- Triggers: `/admin`, `/admin/members`, `/admin/billing`, `/admin/results`
- Responsibilities: Enforce admin access, load admin member metadata, and render admin navigation.

**Billing execution endpoint:**
- Location: `src/app/api/billing/run/route.ts`
- Triggers: POST `/api/billing/run`
- Responsibilities: Validate `batch_month`, prevent duplicate monthly batches, simulate billing outcomes, and persist batch/result rows.

**CMS webhook endpoint:**
- Location: `src/app/api/webhook/cms/route.ts`
- Triggers: POST `/api/webhook/cms`
- Responsibilities: Validate payload, update billing result status, and return webhook acknowledgement.

**Session refresh middleware entry:**
- Location: `src/middleware.ts`
- Triggers: Most non-static requests
- Responsibilities: Forward to `updateSession()` so Supabase cookies stay aligned before page logic runs.

## Error Handling

**Strategy:** Inline guard clauses with redirect-based auth failures on server surfaces and JSON or `{ success, error }` responses on mutation surfaces.

**Patterns:**
- Use `redirect('/login')` or `redirect('/dashboard')` in `src/lib/auth.ts` and `src/lib/admin-auth.ts` instead of rendering access-denied UI.
- Return structured objects from Server Actions such as `registerAccount()` in `src/app/(member)/account/actions.ts` and inspect them in client components.
- Wrap API routes in `try/catch` and return `NextResponse.json(..., { status })` from `src/app/api/billing/run/route.ts` and `src/app/api/webhook/cms/route.ts`.
- Log unexpected server failures with `console.error` inside API routes before returning a generic error payload.

## Cross-Cutting Concerns

**Logging:** Minimal. Only API routes currently emit `console.error` in `src/app/api/billing/run/route.ts` and `src/app/api/webhook/cms/route.ts`.

**Validation:** Lightweight and inline. Forms validate required fields in client code, Server Actions re-check presence/user ownership, and API routes validate required JSON keys and allowed status values.

**Authentication:** Supabase Auth session plus route-level redirects. `src/lib/auth.ts` handles signed-in member checks, and `src/lib/admin-auth.ts` adds an `ADMIN_EMAIL` check before granting admin access.

**Authorization:** Member pages/actions rely on Supabase user context and table RLS. Admin read/write operations that need broader access switch to `createServiceClient()` and are routed only through admin-guarded surfaces.

**Security of account data:** `src/lib/crypto.ts` encrypts raw account numbers before insert, decrypts only on the server for admin/member display logic, and masks before rendering.

**Caching and refresh:** Mutations use `revalidatePath()` for affected routes and interactive clients call `router.refresh()` after successful actions.

---

*Architecture analysis: 2026-04-06*
