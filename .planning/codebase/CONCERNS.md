# Codebase Concerns

**Analysis Date:** 2026-04-06

## Tech Debt

**Admin data access is inconsistent across pages:**
- Issue: Admin-only pages mix `createClient()` and `createServiceClient()`, so some admin screens still run behind user-scoped RLS while others bypass it.
- Files: `src/lib/admin-auth.ts`, `src/lib/supabase/server.ts`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/results/page.tsx`, `src/app/(admin)/admin/members/page.tsx`
- Impact: Admin dashboard numbers and result listings can be incomplete or misleading even when the user passed `requireAdmin()`.
- Fix approach: Centralize admin data loaders behind one explicit admin repository/service that always uses the intended privilege level after `requireAdmin()`.

**Database integrity is enforced in UI code instead of schema constraints:**
- Issue: Important business rules are checked in application code, but the schema does not enforce them with `UNIQUE`, `CHECK`, or enum constraints.
- Files: `supabase/migrations/001_initial_schema.sql`, `src/app/(member)/account/actions.ts`, `src/app/api/billing/run/route.ts`
- Impact: Concurrent requests or manual writes can create duplicate monthly batches, multiple accounts for one member, invalid amounts, and invalid billing days.
- Fix approach: Add database constraints for one account per member, one batch per month, positive amounts, bounded billing days, and allowed status values.

**The lint baseline is already red on core mutation paths:**
- Issue: `npm run lint` fails with multiple `@typescript-eslint/no-explicit-any` errors plus dead-code warnings in auth/session plumbing.
- Files: `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`, `src/components/auth/signup-form.tsx`, `src/components/auth/login-form.tsx`, `src/app/(member)/account/account-form.tsx`, `src/app/(member)/account/account-display.tsx`, `src/app/(member)/consent/consent-card.tsx`, `src/app/(admin)/admin/results/page.tsx`, `src/lib/supabase/middleware.ts`
- Impact: Type regressions are normalized, and future changes start from a failing quality gate.
- Fix approach: Replace `any` with typed Supabase result shapes, clean the middleware warning, and treat lint as a blocking check.

## Known Bugs

**Sign-up writes to a table that has RLS enabled but no insert policy:**
- Symptoms: Auth account creation can succeed while the corresponding `cms_members` row insert fails, leaving the user without app profile data.
- Files: `src/components/auth/signup-form.tsx`, `supabase/migrations/001_initial_schema.sql`, `src/app/(member)/layout.tsx`
- Trigger: Create a new account through `/signup`.
- Workaround: Insert the missing `cms_members` row manually with elevated privileges.

**Bank account deletion likely fails under RLS:**
- Symptoms: `/account` can show a delete action, but the delete mutation runs through `createClient()` and `cms_bank_accounts` has no delete policy.
- Files: `src/app/(member)/account/actions.ts`, `src/app/(member)/account/account-display.tsx`, `supabase/migrations/001_initial_schema.sql`
- Trigger: Delete a registered account from `/account`.
- Workaround: Remove the row with a service-role session or SQL console.

**Admin dashboard metrics can be wrong:**
- Symptoms: Counts on `/admin` are derived with the user-scoped client, so totals reflect only rows visible through RLS instead of full-system totals.
- Files: `src/app/(admin)/admin/page.tsx`, `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_additional_rls_policies.sql`
- Trigger: Open `/admin` as the configured admin user.
- Workaround: Cross-check with `src/app/(admin)/admin/members/page.tsx`, which already uses `createServiceClient()`.

**Admin results can be partial or empty for non-self data:**
- Symptoms: `/admin/results` uses `createClient()` and joins into `cms_billing_results` and `cms_bank_accounts`, but RLS only grants members access to their own result rows.
- Files: `src/app/(admin)/admin/results/page.tsx`, `supabase/migrations/001_initial_schema.sql`
- Trigger: Open a batch result page for a month containing other members' results.
- Workaround: Query the tables directly with elevated privileges until the page uses the service client.

**The account page can hard-fail on bad ciphertext or key rotation:**
- Symptoms: `/account` decrypts `account_number_enc` during render without a guard, so one malformed value or wrong key can crash the page.
- Files: `src/app/(member)/account/page.tsx`, `src/lib/crypto.ts`
- Trigger: Corrupt `cms_bank_accounts.account_number_enc` or rotate `ACCOUNT_ENCRYPTION_KEY` without data migration.
- Workaround: Repair or delete the broken row before loading the page.

## Security Considerations

**The batch billing API has no visible request authorization:**
- Risk: `POST /api/billing/run` creates batches and result rows with `SUPABASE_SERVICE_ROLE_KEY`, but the route does not verify a session, CSRF origin, or admin role.
- Files: `src/app/api/billing/run/route.ts`, `src/lib/supabase/server.ts`
- Current mitigation: Duplicate `batch_month` checks reduce accidental reruns, but they do not protect the endpoint.
- Recommendations: Require authenticated admin identity inside the route, reject cross-site requests, and move privileged writes behind a server action or internal job.

**The webhook endpoint trusts caller input completely:**
- Risk: `POST /api/webhook/cms` updates any `cms_billing_results` row by `result_id` with no signature, timestamp, or replay protection.
- Files: `src/app/api/webhook/cms/route.ts`, `src/lib/supabase/server.ts`
- Current mitigation: The route limits `status` to `success` or `failed`.
- Recommendations: Add HMAC signature verification, idempotency keys, request logging, and replay-window validation.

**Admin authorization is a single email string comparison:**
- Risk: Elevated access is tied to `process.env.ADMIN_EMAIL` rather than persisted roles or claims.
- Files: `src/lib/admin-auth.ts`
- Current mitigation: The user must still be authenticated and present in `cms_members`.
- Recommendations: Move admin role assignment into the database or auth claims, support multiple admins, and log role changes.

**Account encryption provides confidentiality but not integrity:**
- Risk: `src/lib/crypto.ts` uses `aes-256-cbc` without an authentication tag, so tampered ciphertext is not detectable as such.
- Files: `src/lib/crypto.ts`, `src/app/(member)/account/page.tsx`, `src/app/(admin)/admin/members/page.tsx`, `src/app/(admin)/admin/results/page.tsx`
- Current mitigation: UI surfaces only masked values.
- Recommendations: Switch to an AEAD mode such as AES-GCM or a managed KMS envelope, and isolate decryption behind audited server-only code paths.

## Performance Bottlenecks

**Batch execution performs sequential inserts plus per-row recounts:**
- Problem: `src/app/api/billing/run/route.ts` inserts each result row one by one, while `update_batch_counts()` recomputes three aggregate counts on every insert and update.
- Files: `src/app/api/billing/run/route.ts`, `supabase/migrations/002_additional_rls_policies.sql`
- Cause: Per-record network round trips and repeated `count(*)` subqueries create O(n^2) work as batch size grows.
- Improvement path: Bulk insert result rows, compute totals once, and update the batch summary once per run.

**Admin list pages pull and decrypt full datasets in request time:**
- Problem: Member and result pages load broad relations, decrypt account numbers inside render loops, and do not paginate.
- Files: `src/app/(admin)/admin/members/page.tsx`, `src/app/(admin)/admin/results/page.tsx`
- Cause: Every request scans the current result set and performs synchronous decryption work before HTML can stream.
- Improvement path: Add pagination, narrower selects, searchable indexes, and decrypt only the rows needed for the current page.

## Fragile Areas

**Sign-up, login, consent, and account flows depend on loosely typed happy-path code:**
- Files: `src/components/auth/signup-form.tsx`, `src/components/auth/login-form.tsx`, `src/app/(member)/account/actions.ts`, `src/app/(member)/consent/actions.ts`, `src/app/(member)/consent/consent-card.tsx`
- Why fragile: Critical auth and billing-adjacent flows rely on ad hoc error handling, browser alerts, and `any`-typed exceptions.
- Safe modification: Introduce typed form/result objects, shared mutation helpers, and end-to-end tests before refactoring these flows.
- Test coverage: No repo-owned tests exercise these paths.

**Privileged database access is easy to import from general-purpose utilities:**
- Files: `src/lib/supabase/server.ts`, `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`, `src/app/(admin)/admin/members/page.tsx`
- Why fragile: `createServiceClient()` sits next to the regular server client, so future routes can accidentally ship with elevated write access.
- Safe modification: Move service-role helpers into admin/internal-only modules and gate imports through explicit wrappers.
- Test coverage: No authorization regression tests are present.

## Scaling Limits

**Monthly batches are not protected against concurrent starts:**
- Current capacity: One operator clicking once from the UI is the implicit model.
- Limit: Two concurrent requests can both pass the pre-insert existence check because `cms_billing_batches.batch_month` is not unique.
- Scaling path: Add a unique index on `batch_month` and wrap batch creation in a transaction or advisory lock.

**Member number generation is race-prone under concurrent signups:**
- Current capacity: Low write concurrency.
- Limit: `generate_member_no()` uses `count(*) + 1` per month, so overlapping inserts can generate the same `member_no`.
- Scaling path: Replace the count-based trigger in `supabase/migrations/001_initial_schema.sql` with a sequence-backed counter or dedicated serial table.

## Dependencies at Risk

**Next.js middleware convention is deprecated in the current runtime:**
- Risk: `next build` warns that the `middleware` file convention is deprecated in favor of `proxy`.
- Impact: Future Next.js upgrades can break session refresh behavior if this file is not migrated.
- Migration plan: Rename `src/middleware.ts` to the supported convention and retest auth/session propagation.

## Missing Critical Features

**There is no automated test suite for repo code:**
- Problem: `package.json` exposes `dev`, `build`, `start`, and `lint`, but no test command or test framework config, and there are no app-level `*.test.*` or `*.spec.*` files outside `node_modules`.
- Blocks: Safe changes to auth, billing, RLS, encryption, and admin authorization.

**The demo has no idempotency or audit trail around external billing callbacks:**
- Problem: Batch runs and webhook updates mutate financial records without stored request IDs, signatures, source metadata, or replay records.
- Blocks: Reliable reconciliation, retry safety, and realistic CMS integration hardening.

## Test Coverage Gaps

**Authentication and member bootstrap are untested:**
- What's not tested: Sign-up, member row creation, login redirect behavior, and admin email gating.
- Files: `src/components/auth/signup-form.tsx`, `src/components/auth/login-form.tsx`, `src/lib/admin-auth.ts`, `src/app/(member)/layout.tsx`
- Risk: New users can authenticate without usable app data, and admin access bugs can ship unnoticed.
- Priority: High

**Account encryption and deletion flows are untested:**
- What's not tested: Account registration, encryption/decryption behavior, corrupted ciphertext handling, and delete behavior under RLS.
- Files: `src/app/(member)/account/actions.ts`, `src/app/(member)/account/page.tsx`, `src/lib/crypto.ts`, `supabase/migrations/001_initial_schema.sql`
- Risk: Users can get stuck with undeletable or unreadable bank-account records.
- Priority: High

**Privileged write endpoints are untested for authorization and replay behavior:**
- What's not tested: Admin-only access to `POST /api/billing/run`, signature validation for `POST /api/webhook/cms`, duplicate batch prevention, and batch/result consistency.
- Files: `src/app/api/billing/run/route.ts`, `src/app/api/webhook/cms/route.ts`, `supabase/migrations/002_additional_rls_policies.sql`
- Risk: Unauthorized writes and duplicate processing can regress silently.
- Priority: High

---

*Concerns audit: 2026-04-06*
