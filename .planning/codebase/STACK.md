# Technology Stack

**Analysis Date:** 2026-04-06

## Languages

**Primary:**
- TypeScript 5.x - application code under `src/**/*.ts` and `src/**/*.tsx`, including App Router pages in `src/app/**`, Supabase client helpers in `src/lib/supabase/*`, and route handlers in `src/app/api/**`
- SQL (PostgreSQL dialect) - schema and RLS definitions in `supabase/migrations/001_initial_schema.sql` and `supabase/migrations/002_additional_rls_policies.sql`

**Secondary:**
- CSS - global styling and theme tokens in `src/app/globals.css`
- JavaScript/ESM config - repository tooling config in `eslint.config.mjs` and `postcss.config.mjs`
- TOML - local Supabase stack configuration in `supabase/config.toml`

## Runtime

**Environment:**
- Node.js runtime for Next.js Server Components, Route Handlers, and Server Actions. `src/lib/crypto.ts` imports Node `crypto`, so server code is tied to the Node runtime rather than an edge-only deployment model.
- Browser runtime for client auth forms and admin batch trigger UI in `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`, and `src/app/(admin)/admin/billing/billing-run-card.tsx`
- Repository does not pin a Node version: no `engines` field in `package.json`, and no `.nvmrc` or `.node-version` file is present at repo root

**Package Manager:**
- npm - implied by `package-lock.json`
- Lockfile: present (`package-lock.json`, lockfileVersion 3)

## Frameworks

**Core:**
- Next.js 16.2.2 - primary full-stack framework declared in `package.json`, with App Router structure under `src/app/**`
- React 19.2.4 - UI runtime for both client and server components, declared in `package.json`
- Supabase SSR 0.10.0 and Supabase JS 2.101.1 - auth/session/database access via `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/middleware.ts`
- Tailwind CSS 4 - styling pipeline configured via `postcss.config.mjs`, `src/app/globals.css`, and `components.json`
- shadcn/ui scaffold + Base UI primitives - component styling conventions centered in `src/components/ui/*` with generator metadata in `components.json`

**Testing:**
- Not detected. `package.json` does not define test scripts, and no Jest/Vitest/Playwright config is checked in.

**Build/Dev:**
- TypeScript 5 - strict type checking configured in `tsconfig.json`
- ESLint 9 + `eslint-config-next` 16.2.2 - linting in `eslint.config.mjs`
- Supabase CLI 2.84.10 - local database/auth stack and migrations managed from `supabase/`
- Tailwind PostCSS plugin - configured in `postcss.config.mjs`

## Key Dependencies

**Critical:**
- `next` 16.2.2 - powers routing, rendering, server actions, and API handlers defined throughout `src/app/**`
- `react` 19.2.4 and `react-dom` 19.2.4 - view layer for pages and reusable UI in `src/components/**`
- `@supabase/ssr` 0.10.0 - session-aware browser/server clients and middleware session refresh in `src/lib/supabase/*`
- `@supabase/supabase-js` 2.101.1 - Supabase auth and table access used from client components and server code

**Infrastructure:**
- `supabase` 2.84.10 - CLI-driven local stack and migration workflow for `supabase/config.toml` and `supabase/migrations/*`
- `tailwindcss` 4 + `@tailwindcss/postcss` 4 - utility CSS and build-time CSS processing
- `class-variance-authority`, `clsx`, `tailwind-merge` - class composition helpers used by `src/components/ui/*` and `src/lib/utils.ts`
- `lucide-react` - icon library for React UI, declared in `package.json`
- `@base-ui/react` - low-level UI primitives backing the design system dependency set
- `tw-animate-css` - animation utility dependency declared in `package.json`

## Configuration

**Environment:**
- Active application env surface comes from `process.env` reads in `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/crypto.ts`, and `src/lib/admin-auth.ts`
- Required app-level variables are documented in `README.md` and consumed in code:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ACCOUNT_ENCRYPTION_KEY`
  - `ADMIN_EMAIL`
- `.env.local` exists at repo root and is ignored as a secret-bearing local config surface
- Additional optional local Supabase CLI env placeholders appear in `supabase/config.toml` for Studio AI (`OPENAI_API_KEY`), Twilio SMS, and experimental S3 storage, but application code does not read them directly

**Build:**
- `package.json` scripts:
  - `npm run dev` -> `next dev`
  - `npm run build` -> `next build`
  - `npm run start` -> `next start`
  - `npm run lint` -> `eslint`
- `next.config.ts` exists but contains no custom Next.js settings
- `tsconfig.json` enables `strict`, `moduleResolution: "bundler"`, and the `@/*` alias to `./src/*`
- `components.json` configures shadcn aliases and points Tailwind CSS generation at `src/app/globals.css`
- `src/middleware.ts` applies auth/session middleware to all non-static routes

## Platform Requirements

**Development:**
- npm-based local install with `package-lock.json`
- Supabase local stack expected for schema management and local auth/database services via `supabase/config.toml`
- Environment variables required before auth, encryption, or admin access will work
- Browser plus Node server environment needed because the app mixes client components, server components, route handlers, and Node crypto utilities

**Production:**
- Deployment target is documented as Vercel in `README.md`
- No checked-in `vercel.json` or `.vercel/project.json`; deployment settings are expected to live in the hosting platform rather than in-repo
- Production runtime must provide the same Supabase and encryption env vars used in local development

## Practical Stack Notes

- Authentication is handled with Supabase email/password flows from `src/components/auth/login-form.tsx` and `src/components/auth/signup-form.tsx`, then enforced in server code via `src/lib/auth.ts` and `src/lib/admin-auth.ts`
- Sensitive bank account numbers are encrypted with AES-256-CBC in `src/lib/crypto.ts` before insert in `src/app/(member)/account/actions.ts`
- Admin-only operational flows are implemented as internal app endpoints, not external worker services: `src/app/api/billing/run/route.ts` simulates monthly batch billing, and `src/app/api/webhook/cms/route.ts` accepts callback-style status updates
- Database schema, indices, triggers, and RLS policies are owned entirely in `supabase/migrations/*.sql`; no ORM or schema builder is present

---

*Stack analysis: 2026-04-06*
