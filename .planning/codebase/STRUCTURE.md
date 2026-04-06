# Codebase Structure

**Analysis Date:** 2026-04-06

## Directory Layout

```text
cms-auto-debit-demo/
├── src/                    # Next.js application source
│   ├── app/                # App Router routes, layouts, pages, actions, API handlers
│   ├── components/         # Shared auth components and shadcn-style UI primitives
│   ├── lib/                # Auth, Supabase client factories, crypto, constants, helpers
│   ├── types/              # Domain interfaces aligned with database tables
│   └── middleware.ts       # Request-time Supabase session refresh middleware
├── public/                 # Static assets served by Next.js
├── supabase/               # Local Supabase config and SQL migrations
│   ├── migrations/         # Schema, RLS, trigger, and index definitions
│   └── config.toml         # Supabase local project config
├── .planning/codebase/     # Generated mapper reference docs
├── package.json            # Scripts and package manifest
├── tsconfig.json           # TypeScript config with `@/*` path alias
├── components.json         # shadcn/ui generator configuration
└── next.config.ts          # Next.js config
```

## Directory Purposes

**`src/app`:**
- Purpose: Own all route segments, layouts, route groups, API routes, and feature-local mutation handlers.
- Contains: `layout.tsx`, `page.tsx`, `actions.ts`, `route.ts`, and client leaves such as `billing-run-card.tsx`.
- Key files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/(member)/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/app/api/billing/run/route.ts`

**`src/app/(auth)`:**
- Purpose: Public auth surface for sign-in and sign-up.
- Contains: Thin pages that delegate to shared auth components.
- Key files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

**`src/app/(member)`:**
- Purpose: Member-facing application surface after login.
- Contains: Member shell layout, logout action, feature folders for dashboard, account, consent, and payments.
- Key files: `src/app/(member)/layout.tsx`, `src/app/(member)/dashboard/page.tsx`, `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`

**`src/app/(admin)`:**
- Purpose: Admin-facing application surface.
- Contains: Admin shell layout and admin route tree rooted at `admin`.
- Key files: `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/members/page.tsx`, `src/app/(admin)/admin/results/page.tsx`

**`src/app/api`:**
- Purpose: HTTP endpoints for operations that are modeled as API calls instead of Server Actions.
- Contains: Billing execution and webhook handlers.
- Key files: `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`

**`src/components/auth`:**
- Purpose: Reusable auth forms used by public auth pages.
- Contains: Browser-only login/signup forms.
- Key files: `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`

**`src/components/ui`:**
- Purpose: Shared design-system primitives generated/configured with shadcn.
- Contains: Alerts, badges, buttons, cards, dialog, inputs, labels, select, table.
- Key files: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/table.tsx`

**`src/lib`:**
- Purpose: Shared non-visual logic and boundary helpers.
- Contains: Auth guards, admin guard, Supabase client factories, crypto, constants, className utility.
- Key files: `src/lib/auth.ts`, `src/lib/admin-auth.ts`, `src/lib/crypto.ts`, `src/lib/constants.ts`, `src/lib/utils.ts`

**`src/lib/supabase`:**
- Purpose: Encapsulate Supabase client setup for browser, server, service role, and middleware.
- Contains: `client.ts`, `server.ts`, `middleware.ts`
- Key files: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`

**`src/types`:**
- Purpose: Hold table-aligned TypeScript interfaces and union types.
- Contains: Database entity shapes.
- Key files: `src/types/database.ts`

**`supabase/migrations`:**
- Purpose: Source of truth for schema, RLS, triggers, and indexes.
- Contains: Ordered SQL migrations.
- Key files: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_additional_rls_policies.sql`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Root redirect controller.
- `src/app/layout.tsx`: Root HTML/body layout and global CSS import.
- `src/app/(member)/layout.tsx`: Member route shell with auth guard and navigation.
- `src/app/(admin)/layout.tsx`: Admin route shell with admin guard and navigation.
- `src/middleware.ts`: Request middleware for Supabase session refresh.

**Configuration:**
- `package.json`: NPM scripts and dependency definitions.
- `tsconfig.json`: TypeScript compiler options and `@/*` alias.
- `next.config.ts`: Next config placeholder.
- `components.json`: shadcn generator aliases and CSS target.
- `supabase/config.toml`: Supabase local project configuration.

**Core Logic:**
- `src/lib/auth.ts`: Member auth guard helpers.
- `src/lib/admin-auth.ts`: Admin authorization helper.
- `src/lib/supabase/server.ts`: Server and service Supabase client factories.
- `src/lib/crypto.ts`: Account encryption, decryption, and masking.
- `src/app/(member)/account/actions.ts`: Account create/delete mutation logic.
- `src/app/(member)/consent/actions.ts`: Consent grant/revoke mutation logic.
- `src/app/api/billing/run/route.ts`: Batch billing orchestration.
- `src/app/api/webhook/cms/route.ts`: Webhook update handler.

**Testing:**
- Not detected. There are no `*.test.*` or `*.spec.*` files in the inspected tree.

## Naming Conventions

**Files:**
- Route entry files use Next.js conventions: `page.tsx`, `layout.tsx`, `route.ts`.
- Feature-local mutation files use `actions.ts`: `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`.
- Feature-local client leaves use descriptive kebab-case names: `billing-run-card.tsx`, `account-display.tsx`, `consent-card.tsx`.
- Shared non-route modules use kebab-case or simple lowercase filenames under `src/lib` and `src/components/ui`.

**Directories:**
- Route groups use parenthesized names to segment concerns without affecting the URL: `src/app/(auth)`, `src/app/(member)`, `src/app/(admin)`.
- Actual URL segments are plain folder names below the group: `src/app/(admin)/admin/results` maps to `/admin/results`.
- Feature folders sit directly under the owning surface: `src/app/(member)/account`, `src/app/(member)/consent`, `src/app/(admin)/admin/billing`.

## Route Groups and URL Mapping

**Public auth group:**
- Source: `src/app/(auth)`
- URLs: `/login`, `/signup`
- Notes: Pages are thin wrappers around shared auth forms in `src/components/auth`.

**Member group:**
- Source: `src/app/(member)`
- URLs: `/dashboard`, `/account`, `/consent`, `/payments`
- Notes: Shared shell and auth check live in `src/app/(member)/layout.tsx`.

**Admin group:**
- Source: `src/app/(admin)`
- URLs: `/admin`, `/admin/members`, `/admin/billing`, `/admin/results`
- Notes: Shared shell and admin check live in `src/app/(admin)/layout.tsx`.

**API group:**
- Source: `src/app/api`
- URLs: `/api/billing/run`, `/api/webhook/cms`
- Notes: Use `route.ts` handlers instead of UI pages.

## Where to Add New Code

**New member feature page:**
- Primary code: Add a new folder under `src/app/(member)/<feature>/page.tsx`.
- Interactive leaf: Put the browser-only component in the same feature folder, following patterns like `src/app/(member)/account/account-form.tsx`.
- Mutations: Add `src/app/(member)/<feature>/actions.ts` if the feature can be handled as a Server Action.

**New admin tool:**
- Primary code: Add under `src/app/(admin)/admin/<feature>/page.tsx`.
- Interactive control: Keep the client control beside the page, as in `src/app/(admin)/admin/billing/billing-run-card.tsx`.
- Privileged data access: Use `createServiceClient()` from `src/lib/supabase/server.ts` when the feature needs cross-user visibility or bypasses member RLS.

**New public auth-related page:**
- Primary code: Add under `src/app/(auth)/<route>/page.tsx`.
- Shared form or widget: Put reusable auth UI in `src/components/auth`.

**New API endpoint:**
- Implementation: Add `src/app/api/<path>/route.ts`.
- Shared helpers: Reuse `src/lib/supabase/server.ts`, `src/lib/auth.ts`, and `src/lib/crypto.ts` rather than duplicating setup.

**New shared utility or boundary helper:**
- Implementation: Add to `src/lib`.
- Supabase-specific helper: Add to `src/lib/supabase`.
- Domain types: Extend `src/types/database.ts` if the helper exposes database-shaped data.

**New reusable UI primitive:**
- Implementation: Add to `src/components/ui`.
- Feature-specific visual component: Keep it inside the owning route folder unless it is reused by multiple surfaces.

**Database schema change:**
- SQL: Add a new ordered migration under `supabase/migrations`.
- TS shape: Update `src/types/database.ts` in the same change so code stays aligned with the schema.

## Practical Placement Rules

**Use page-local files when behavior is feature-specific:**
- Example: `src/app/(member)/account/account-form.tsx` and `src/app/(member)/account/account-display.tsx` stay beside `src/app/(member)/account/page.tsx`.

**Use `src/components/*` only for reused UI:**
- Example: Auth forms are shared enough to live in `src/components/auth`, while billing controls stay local to the billing route.

**Keep Supabase queries close to the route that owns them:**
- Example: `src/app/(member)/payments/page.tsx` builds its own filter query instead of calling a repository layer.

**Keep guards out of pages when they are reused:**
- Example: `requireAuth()` and `requireAdmin()` live in `src/lib` and are called from layouts and pages.

## Special Directories

**`.planning/codebase`:**
- Purpose: Generated architecture, stack, testing, conventions, and concern docs for GSD workflows.
- Generated: Yes
- Committed: Intended to be committed.

**`.next`:**
- Purpose: Next.js build output and development cache.
- Generated: Yes
- Committed: No

**`node_modules`:**
- Purpose: Installed dependencies.
- Generated: Yes
- Committed: No

**`supabase/.temp`:**
- Purpose: Local Supabase CLI state.
- Generated: Yes
- Committed: Typically no.

## Current Source Tree Reference

```text
src/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── billing/
│   │   │   │   ├── billing-run-card.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── members/
│   │   │   │   └── page.tsx
│   │   │   ├── results/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (member)/
│   │   ├── account/
│   │   │   ├── account-display.tsx
│   │   │   ├── account-form.tsx
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── consent/
│   │   │   ├── actions.ts
│   │   │   ├── consent-card.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── actions.ts
│   │   └── layout.tsx
│   ├── api/
│   │   ├── billing/run/route.ts
│   │   └── webhook/cms/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   └── ui/
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── table.tsx
├── lib/
│   ├── admin-auth.ts
│   ├── auth.ts
│   ├── constants.ts
│   ├── crypto.ts
│   ├── utils.ts
│   └── supabase/
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── middleware.ts
└── types/
    └── database.ts
```

---

*Structure analysis: 2026-04-06*
