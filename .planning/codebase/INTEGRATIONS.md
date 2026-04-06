# External Integrations

**Analysis Date:** 2026-04-06

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - primary external platform for authentication, Postgres data access, and session management
  - SDK/Client: `@supabase/ssr` and `@supabase/supabase-js` from `package.json`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Implementation examples:
    - Browser auth client in `src/lib/supabase/client.ts`
    - Cookie-backed server client in `src/lib/supabase/server.ts`
    - Session refresh middleware in `src/lib/supabase/middleware.ts`

**Payment/CMS boundary:**
- External CMS billing callback boundary - represented by `src/app/api/webhook/cms/route.ts`
  - SDK/Client: none; endpoint accepts raw JSON via Next.js Route Handler
  - Auth: no signature verification or shared-secret validation detected in code
  - Current use: updates `cms_billing_results` rows with `result_id`, `status`, `fail_reason`, and `processed_at`
  - Important boundary note: this route is shaped like an inbound third-party webhook, but current implementation is a demo/simulation rather than a full provider integration

**Hosting platform:**
- Vercel - deployment target documented in `README.md`
  - SDK/Client: none in application code
  - Auth: platform-level configuration not checked in
  - Evidence: deployment instructions in `README.md` and `.vercel` ignored in `.gitignore`

## Data Storage

**Databases:**
- Supabase Postgres
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` for regular app access, `SUPABASE_SERVICE_ROLE_KEY` for privileged server access
  - Client: Supabase JS/SSR clients in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`
  - Schema ownership: `supabase/migrations/001_initial_schema.sql` and `supabase/migrations/002_additional_rls_policies.sql`
  - Core tables:
    - `cms_members`
    - `cms_bank_accounts`
    - `cms_billing_schedules`
    - `cms_billing_batches`
    - `cms_billing_results`
  - Database-side logic:
    - `generate_member_no()` trigger assigns member numbers in `supabase/migrations/001_initial_schema.sql`
    - `update_batch_counts()` trigger recalculates batch totals in `supabase/migrations/002_additional_rls_policies.sql`

**File Storage:**
- No app-level file storage integration detected
- `supabase/config.toml` enables local Supabase Storage services, but no code under `src/` uses storage buckets or uploads

**Caching:**
- None detected beyond default Next.js request/render behavior
- No Redis, CDN cache API, or background queue integration is present in repository code

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: email/password authentication from client components, session cookies refreshed in middleware, and authorization enforced in server utilities
  - Sign-in flow: `src/components/auth/login-form.tsx` calls `supabase.auth.signInWithPassword`
  - Sign-up flow: `src/components/auth/signup-form.tsx` calls `supabase.auth.signUp`, then inserts a matching row into `cms_members`
  - Session enforcement:
    - `src/lib/auth.ts` redirects unauthenticated users to `/login`
    - `src/lib/admin-auth.ts` compares `user.email` against `ADMIN_EMAIL` and then looks up the corresponding `cms_members` row
  - Middleware surface: `src/middleware.ts` and `src/lib/supabase/middleware.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, LogRocket, Datadog, or OpenTelemetry integration is checked in.

**Logs:**
- Basic `console.error` logging in server endpoints:
  - `src/app/api/billing/run/route.ts`
  - `src/app/api/webhook/cms/route.ts`
- No structured logger, log drain, or tracing abstraction is present

## CI/CD & Deployment

**Hosting:**
- Intended hosting platform is Vercel per `README.md`

**CI Pipeline:**
- None detected in repo. No GitHub Actions workflow, no checked-in Vercel project config, and no separate build pipeline configuration files are present.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - used by `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/middleware.ts`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - used by browser/server Supabase clients for normal authenticated app access
- `SUPABASE_SERVICE_ROLE_KEY` - used by `createServiceClient()` in `src/lib/supabase/server.ts` and consumed by privileged admin/API code such as `src/app/api/billing/run/route.ts` and `src/app/api/webhook/cms/route.ts`
- `ACCOUNT_ENCRYPTION_KEY` - used by `src/lib/crypto.ts` to encrypt/decrypt bank account numbers
- `ADMIN_EMAIL` - used by `src/lib/admin-auth.ts` to gate admin pages

**Secrets location:**
- Local secrets surface: root `.env.local` file exists
- Deployment secrets are expected in hosting environment configuration; no committed secret store config is present
- Supabase local development also references optional env-backed secrets in `supabase/config.toml`, including:
  - `OPENAI_API_KEY` for local Studio AI features
  - `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` for optional Twilio SMS auth
  - `S3_HOST`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` for optional experimental storage

## Webhooks & Callbacks

**Incoming:**
- `src/app/api/webhook/cms/route.ts` - accepts POST payloads shaped like external billing result callbacks and persists result status updates

**Outgoing:**
- No outbound third-party webhooks or API calls detected in `src/`
- Internal frontend-to-backend call only:
  - `src/app/(admin)/admin/billing/billing-run-card.tsx` posts to internal route `/api/billing/run`

## Service Boundaries and Access Patterns

**Standard user access:**
- User-facing pages and server actions use the anon-key Supabase client with session cookies
- Examples:
  - `src/app/(member)/account/actions.ts`
  - `src/app/(member)/consent/actions.ts`
  - `src/app/(member)/payments/page.tsx`

**Privileged service access:**
- Admin views and backend routes that need unrestricted reads/writes use `createServiceClient()` from `src/lib/supabase/server.ts`
- Examples:
  - `src/app/(admin)/admin/members/page.tsx`
  - `src/app/api/billing/run/route.ts`
  - `src/app/api/webhook/cms/route.ts`
- RLS still exists at the database layer, but service-role clients bypass it by design

**Encryption boundary:**
- Plaintext account numbers are accepted in member-facing form actions, encrypted before persistence, then decrypted only in trusted server-side admin screens
- Examples:
  - Encrypt on write: `src/app/(member)/account/actions.ts`
  - Decrypt for masked display: `src/app/(admin)/admin/members/page.tsx` and `src/app/(admin)/admin/results/page.tsx`

## Integration Gaps Worth Preserving in Plans

- No actual outbound Hyosung CMS API client is implemented; the system simulates batch outcomes locally in `src/app/api/billing/run/route.ts`
- No webhook verification, request signing, IP allowlist, or replay protection exists on `src/app/api/webhook/cms/route.ts`
- No email, SMS, analytics, or error-monitoring integration is present in application code, even though local Supabase config exposes optional hooks for some of those services

---

*Integration audit: 2026-04-06*
