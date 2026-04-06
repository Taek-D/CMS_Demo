# Phase 3: Add parent-childcare domain foundation - Research

**Researched:** 2026-04-06
**Domain:** Next.js App Router + Supabase relational modeling for parent/childcare membership data
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add dedicated tables for childcare centers, classes, and children rather than overloading `cms_members`. Parents remain members; children are separate records linked back to a parent member.
- **D-02:** A class belongs to exactly one childcare center, and a child stores one active class assignment for the initial version. History tracking is out of scope for this phase.
- **D-03:** Parents can register multiple children under one member account because that better matches real household usage.
- **D-04:** Add a dedicated member-facing child management page under the existing member route group instead of hiding child registration inside the dashboard card summary.
- **D-05:** The childcare selection flow should be two-step searchable selection: choose childcare center first, then choose a class scoped to that center.
- **D-06:** The parent page should support create, edit, and list behaviors in one place; child deletion can be handled as a simple remove action without archival rules in this phase.
- **D-07:** Reuse the admin member-management surface as the first integration point, but add child count, childcare center, and class relationship visibility so the CRM immediately shows the richer domain.
- **D-08:** Add basic search/filter capability by parent name, child name, childcare center, and class because this is the minimum admin proof that the new data model is practically usable.
- **D-09:** Keep `member_no` generation unchanged and treat the new child/class/center relationships as additive extensions around the existing member and billing model.
- **D-10:** Protect new parent-owned child rows with RLS patterns consistent with the current member/account flow, while admin reads should continue through service-role-backed admin pages.

### Claude's Discretion
- Exact naming for routes, table columns, and page labels as long as the parent/child/class relationships remain explicit.
- Whether class selection uses a modal, inline select, or progressive search UI.
- Whether admin relationship visibility lives on the existing members page only or also gets a lightweight dedicated child-management page.

### Deferred Ideas (OUT OF SCOPE)
- Multiple historical class assignments per child.
- Child attendance, enrollment dates, or contract status.
- Parent approval flows or center-operated class creation UX beyond the minimum admin management surface.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Read the relevant Next.js guide in `node_modules/next/dist/docs/` before writing code.
- Do not trust stale Next.js training-data assumptions about APIs, conventions, or file structure.
- Heed deprecation notices in the current local Next.js docs.

## Summary

Phase 3 should stay additive and normalized. Keep parents in `cms_members`, add dedicated tables for childcare centers, childcare classes, and children, and wire the new child records to the existing member account through `parent_member_id`. The child should store a single active `class_id`; the center should be derived through the class relationship instead of being duplicated on the child row.

For execution planning, the cleanest scope is: one migration that adds schema, foreign keys, indexes, and RLS; one new member route for child CRUD under the existing `(member)` route group; one enrichment pass on the admin members page for relationship visibility and filtering; one synchronized manual update to `src/types/database.ts`; and seed data for centers/classes instead of building full admin CRUD for those reference entities in this phase.

**Primary recommendation:** Implement Phase 3 as an additive Supabase schema with migration-seeded center/class reference data, member-owned child CRUD through Server Actions plus RLS, and admin relationship visibility layered onto the existing admin members page.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.2 | App Router pages, Server Actions, revalidation | Already the project runtime and the documented form/action path for this codebase |
| React | 19.2.4 | Client leaves for searchable selection and edit state | Matches the current app and Next 16 guidance |
| `@supabase/supabase-js` | 2.101.1 | Data access for nested relation reads and writes | Already used across member/admin flows |
| `@supabase/ssr` | 0.10.0 | Server-side client creation tied to Next cookies | Existing project boundary for authenticated pages |
| Supabase CLI | 2.84.10 | SQL migrations and local database workflow | Already present in the repo and aligned with current migration flow |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 4.3.6 | Structured form validation in Server Actions | Use if child form validation expands beyond a few required fields |
| Vitest | 4.1.2 | Fast unit/integration tests for actions and server components | Add in Wave 0 because the repo currently has no test runner |
| jsdom | 29.0.1 | Browser-like environment for Vitest component tests | Required with Testing Library in App Router UI tests |
| `@vitejs/plugin-react` | 6.0.1 | React transform support for Vitest | Standard Vitest setup for React component tests |
| `@testing-library/react` | 16.3.2 | Form and interaction testing for member/admin UI | Use for the child form and filter UI |
| `@playwright/test` | 1.59.1 | One end-to-end smoke path across parent/admin surfaces | Use after the unit/integration harness exists |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `cms_children` table | Store children in `cms_members` | Simpler short-term, but breaks the locked parent/member distinction and muddies billing/member semantics |
| Child stores only `class_id` | Child stores both `center_id` and `class_id` | Slightly easier queries, but creates integrity drift when class and center disagree |
| Migration-seeded center/class reference data | Admin CRUD for centers/classes in Phase 3 | Richer operations, but broader scope than the locked phase intent |

**Installation:**
```bash
# Optional runtime validation helper
npm install zod

# Wave 0 validation setup
npm install -D vitest jsdom @vitejs/plugin-react @testing-library/react @playwright/test
```

**Version verification:** Verified against the current npm registry on 2026-04-06.
- `next` `16.2.2` - published 2026-04-01
- `react` `19.2.4` - published 2026-01-26
- `@supabase/supabase-js` `2.101.1` - published 2026-03-31
- `@supabase/ssr` `0.10.0` - published 2026-03-30
- `supabase` `2.84.10` - published 2026-04-03
- `zod` `4.3.6` - published 2026-01-22
- `vitest` `4.1.2` - published 2026-03-26
- `jsdom` `29.0.1` - registry modified 2026-03-20
- `@vitejs/plugin-react` `6.0.1` - registry modified 2026-03-13
- `@testing-library/react` `16.3.2` - published 2026-01-19
- `@playwright/test` `1.59.1` - published 2026-04-01

## Architecture Patterns

### Recommended Project Structure
```text
supabase/
+-- migrations/
|   +-- 006_parent_childcare_domain.sql   # New tables, FKs, indexes, RLS, and seed rows

src/
+-- app/
|   +-- (member)/
|   |   +-- children/
|   |   |   +-- actions.ts               # Child CRUD server actions
|   |   |   +-- child-form.tsx           # Client leaf for form/search UI
|   |   |   +-- page.tsx                 # Server page with parent-owned child list
|   |   +-- dashboard/page.tsx           # Link or summary card to child management
|   |   +-- layout.tsx                   # Member nav update
|   +-- (admin)/
|       +-- admin/
|           +-- members/page.tsx         # Parent/child/center/class visibility and filters
+-- types/
    +-- database.ts                      # Manual interface sync for new tables
```

### Pattern 1: Normalized Childcare Domain
**What:** Model the domain as `cms_members -> cms_children -> cms_childcare_classes -> cms_childcare_centers`. Keep one active class per child and derive center through the class relationship.

**When to use:** Always for this phase. This is the locked shape of the data model.

**Example:**
```sql
create table public.cms_childcare_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.cms_childcare_classes (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.cms_childcare_centers(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (center_id, name)
);

create table public.cms_children (
  id uuid primary key default gen_random_uuid(),
  parent_member_id uuid not null references public.cms_members(id) on delete cascade,
  class_id uuid not null references public.cms_childcare_classes(id) on delete restrict,
  name text not null,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
Source: project migration patterns plus Supabase foreign-key guidance at `https://supabase.com/docs/guides/database/postgres/cascade-deletes`

### Pattern 2: Member Mutations Through Server Actions + RLS
**What:** Keep child create/edit/delete inside feature-local `actions.ts`, verify the current member inside every action, and use the regular server Supabase client so RLS remains active.

**When to use:** Every parent-owned mutation on the new member-facing child page.

**Example:**
```ts
'use server';

import { revalidatePath } from 'next/cache';

import { requireCurrentMember } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function upsertChild(formData: FormData) {
  const member = await requireCurrentMember();
  const supabase = await createClient();

  const childId = formData.get('childId')?.toString() || null;
  const name = formData.get('name')?.toString().trim() || '';
  const classId = formData.get('classId')?.toString() || '';

  if (!name || !classId) {
    return { success: false, error: 'Name and class are required.' };
  }

  const payload = {
    id: childId ?? undefined,
    parent_member_id: member.id,
    class_id: classId,
    name,
  };

  const { error } = await supabase.from('cms_children').upsert(payload);

  if (error) {
    return { success: false, error: 'Failed to save child.' };
  }

  revalidatePath('/children');
  revalidatePath('/dashboard');
  return { success: true };
}
```
Source: local Next docs `node_modules/next/dist/docs/01-app/02-guides/forms.md`, official forms guide `https://nextjs.org/docs/app/guides/forms`, and the existing member action pattern in `src/app/(member)/account/actions.ts`

### Pattern 3: Admin Reads Through Service Role + Relation Nesting
**What:** Keep admin-wide reads on the server page with `createServiceClient()`, select nested child/class/center relations directly, and switch related joins to `!inner` only when a related filter is active.

**When to use:** Enriching the existing admin members page with child count, center, class, and related search/filter behavior.

**Example:**
```ts
const { data, error } = await supabase
  .from('cms_members')
  .select(`
    id,
    member_no,
    name,
    email,
    children:cms_children!inner (
      id,
      name,
      class:cms_childcare_classes!inner (
        id,
        name,
        center:cms_childcare_centers!inner (
          id,
          name
        )
      )
    )
  `)
  .ilike('children.name', `%${childName}%`);
```
Source: project admin page pattern in `src/app/(admin)/admin/members/page.tsx` and Supabase joins/nesting guide `https://supabase.com/docs/guides/database/joins-and-nesting`

### Anti-Patterns to Avoid
- **Overloading `cms_members` for children:** Breaks the locked parent/member distinction and complicates billing semantics.
- **Storing both `center_id` and `class_id` on `cms_children`:** Creates update drift and inconsistent data.
- **Using service-role writes in member flows:** Bypasses the RLS boundary the phase explicitly requires.
- **Building full center/class admin CRUD now:** Expands scope beyond the locked phase boundary.
- **Changing `member_no` generation logic in the same phase:** Creates unnecessary regression risk around the existing billing model.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parent/child modeling | A polymorphic `cms_members` table for both parents and children | Dedicated `cms_children` linked to `cms_members` | Keeps billing/member semantics stable and preserves one household-to-many-children |
| Center/class integrity | Duplicate foreign keys on child rows | Child `class_id` plus class `center_id` | One source of truth for the center relationship |
| Parent authorization | Manual `where parent_id = ...` checks in client code | Supabase RLS with authenticated policies | Centralizes ownership protection and matches the current account flow |
| Admin global reads | Broad read policies on child tables | Existing service-role-backed admin pages | Avoids weakening RLS for regular users |
| Searchable selection UI | New heavy combobox/search library | Small client leaf using existing inputs/selects and server-provided options | Phase scope only needs a two-step searchable flow, not a new UI subsystem |
| Validation harness | Custom ad hoc test scripts | Next-documented Vitest + Playwright stack | Reduces setup ambiguity and matches current Next guidance |

**Key insight:** The deceptively hard part of this phase is not rendering one more form. It is preserving domain integrity and security while making the admin view queryable. Lean on relational schema design, RLS, and Supabase relation nesting instead of compensating later with custom code.

## Common Pitfalls

### Pitfall 1: Redundant center and class storage on the child row
**What goes wrong:** A child points at a class from one center and a manually stored center from another.

**Why it happens:** Teams optimize query convenience too early.

**How to avoid:** Store `class_id` only on `cms_children` and derive center through the class join.

**Warning signs:** You need trigger logic just to keep center and class in sync.

### Pitfall 2: RLS update policies without a matching select policy
**What goes wrong:** Updates or deletes fail unexpectedly for authenticated parents even though the row is theirs.

**Why it happens:** In Postgres RLS, update visibility depends on the row also being selectable.

**How to avoid:** Create matching `select`, `insert`, `update`, and `delete` policies for parent-owned child rows, and scope them `to authenticated`.

**Warning signs:** Parent can insert a child but cannot see or edit it afterward.

### Pitfall 3: Admin related filters that still use left joins
**What goes wrong:** Filtering by child, class, or center still returns unrelated parent rows.

**Why it happens:** Supabase relation nesting defaults to left joins unless `!inner` is used on the embedded relation.

**How to avoid:** Use `!inner` for the embedded relation only when a related filter is active.

**Warning signs:** A filter on child name changes child payloads but not the parent result set.

### Pitfall 4: Member page ships with no usable reference data
**What goes wrong:** The two-step selection UI exists, but there are no centers or classes to pick.

**Why it happens:** Teams defer reference data population to a later phase without realizing the member flow depends on it immediately.

**How to avoid:** Seed a minimum realistic set of childcare centers and classes in the phase migration or seed script.

**Warning signs:** Manual DB inserts become part of the test instructions.

### Pitfall 5: Database migration and manual TypeScript types drift apart
**What goes wrong:** The schema works in Supabase, but the app breaks because `src/types/database.ts` does not include the new tables and relations.

**Why it happens:** This repo uses hand-maintained interfaces rather than generated database types.

**How to avoid:** Treat migration and `src/types/database.ts` edits as one task, not two independent follow-ups.

**Warning signs:** New relation fields compile as `any` or the page casts around missing types.

### Pitfall 6: Phase 3 accidentally rewrites existing member registration assumptions
**What goes wrong:** Existing signup, billing schedule, or `member_no` flows regress because the new domain logic leaks into the current member core.

**Why it happens:** Teams thread child logic into member creation instead of layering it after member creation.

**How to avoid:** Keep the current auth trigger and `generate_member_no()` behavior untouched. Add childcare linkage after the member already exists.

**Warning signs:** Migration changes touch the existing `cms_members` primary-key or member-number logic.

## Code Examples

Verified patterns from official sources and the current codebase:

### Parent-owned child RLS
```sql
alter table public.cms_children enable row level security;

create policy "parents can read their children"
  on public.cms_children
  for select
  to authenticated
  using ((select auth.uid()) = parent_member_id);

create policy "parents can insert their children"
  on public.cms_children
  for insert
  to authenticated
  with check ((select auth.uid()) = parent_member_id);

create policy "parents can update their children"
  on public.cms_children
  for update
  to authenticated
  using ((select auth.uid()) = parent_member_id)
  with check ((select auth.uid()) = parent_member_id);
```
Source: Supabase RLS guide `https://supabase.com/docs/guides/database/postgres/row-level-security`

### Two-step member form state
```tsx
'use client';

type Center = { id: string; name: string };
type ChildcareClass = { id: string; name: string; center_id: string };

export function ChildForm({
  centers,
  classes,
}: {
  centers: Center[];
  classes: ChildcareClass[];
}) {
  const [centerId, setCenterId] = useState('');
  const scopedClasses = classes.filter((item) => item.center_id === centerId);

  return (
    <>
      <Input name="centerSearch" placeholder="Search center" />
      <Select name="centerId" value={centerId} onValueChange={setCenterId}>
        {centers.map((center) => (
          <SelectItem key={center.id} value={center.id}>
            {center.name}
          </SelectItem>
        ))}
      </Select>
      <Select name="classId" disabled={!centerId}>
        {scopedClasses.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </Select>
    </>
  );
}
```
Source: current shared UI primitives plus the locked two-step selection requirement

### Additive dashboard integration
```tsx
<Card>
  <CardHeader>
    <CardTitle>Children</CardTitle>
  </CardHeader>
  <CardContent>
    <p>{children.length} registered</p>
    <Link href="/children">Manage children</Link>
  </CardContent>
</Card>
```
Source: current member dashboard card pattern in `src/app/(member)/dashboard/page.tsx`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API-route or client-managed form mutations | App Router Server Actions with auth checks and `revalidatePath` | Current Next App Router guidance | Fits the existing project pattern and keeps data mutations close to the feature |
| Flat account model carrying every concept | Additive relational tables around the member core | Current product roadmap direction | Supports realistic parent/childcare domain growth without breaking billing flows |
| Manual backend join logic for admin projections | FK-driven relation nesting in Supabase select strings | Current Supabase/PostgREST pattern | Faster admin integration and less custom glue code |

**Deprecated/outdated:**
- Treating Next.js Server Action examples from older App Router releases as current truth: this repo explicitly requires consulting the local Next 16 docs before implementation.
- Treating RLS as optional because admin pages use service role: parent-owned child data still needs explicit authenticated policies.

## Open Questions

1. **What is the minimum child profile for Phase 3 beyond name and class?**
   What we know: The roadmap only requires create/edit/view plus class linkage.
   What's unclear: Whether a realistic demo needs `birth_date`, nickname, or notes now.
   Recommendation: Keep the required fields to `name` and `class_id`; add `birth_date` only if the UI needs one more realism field without affecting billing logic.

2. **Where should the initial center/class reference data come from?**
   What we know: Rich center/class creation UX is deferred, but the member page cannot function without options.
   What's unclear: Whether the team wants migration-seeded demo data or a lightweight SQL seed separate from the migration.
   Recommendation: Seed through SQL in this phase so the environment is immediately usable after migrations.

3. **Does admin need a dedicated child page now?**
   What we know: The locked requirement says the existing members page is the first integration point.
   What's unclear: Whether relationship density will make the page too crowded.
   Recommendation: Plan Phase 3 around the existing members page only; split to a dedicated child page later if the admin page becomes unreadable.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next app runtime, scripts, tests | Yes | 22.17.1 | - |
| npm | Package install and scripts | Yes | 10.9.2 | - |
| Supabase CLI | Migrations and local database workflow | Yes | 2.84.10 | - |
| `.env.local` Supabase/app keys | Runtime access for member/admin flows | Yes | file present | - |
| `SUPABASE_DB_PASSWORD` | Some direct Supabase CLI database commands | No | - | Avoid password-requiring commands for this phase or source the secret first |

**Missing dependencies with no fallback:**
- None identified for planning or implementation of this phase.

**Missing dependencies with fallback:**
- `SUPABASE_DB_PASSWORD` is not currently available locally according to `.planning/STATE.md`; planner should avoid steps that depend on direct password-authenticated CLI database inspection.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed yet in repo; recommended Wave 0 stack is Vitest 4.1.2 + Testing Library 16.3.2, with Playwright 1.59.1 for one smoke path |
| Config file | none - see Wave 0 |
| Quick run command | `npm run lint` today; `npx vitest run <target>` after Wave 0 |
| Full suite command | none today; `npx vitest run && npx playwright test` after Wave 0 |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P3-01 | Parent can create, edit, and view child records | integration | `npx vitest run src/app/(member)/children/actions.test.ts` | No - Wave 0 |
| P3-02 | Parent can link a child to center then class through a scoped searchable flow | component/integration | `npx vitest run src/app/(member)/children/child-form.test.tsx` | No - Wave 0 |
| P3-03 | Admin members page can view parent, child, center, and class relationships together | integration | `npx vitest run src/app/(admin)/admin/members/page.test.tsx` | No - Wave 0 |
| P3-04 | Existing member/billing foundations remain intact after additive schema changes | smoke | `npx playwright test tests/member-billing-smoke.spec.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** `npx vitest run && npx playwright test`

### Wave 0 Gaps
- [ ] `vitest.config.ts` - establish App Router-compatible unit/integration test runner
- [ ] `playwright.config.ts` - establish smoke test runner
- [ ] `src/app/(member)/children/actions.test.ts` - covers parent-owned CRUD behavior
- [ ] `src/app/(member)/children/child-form.test.tsx` - covers center/class scoped selection behavior
- [ ] `src/app/(admin)/admin/members/page.test.tsx` - covers admin relationship projection
- [ ] `tests/member-billing-smoke.spec.ts` - covers non-regression around current member/billing flow
- [ ] Framework install: `npm install -D vitest jsdom @vitejs/plugin-react @testing-library/react @playwright/test`

## Sources

### Primary (HIGH confidence)
- Local Next 16 docs: `node_modules/next/dist/docs/01-app/02-guides/forms.md` - Server Actions form pattern and auth warning
- `https://nextjs.org/docs/app/guides/forms` - current App Router forms guidance
- `https://nextjs.org/docs/app/guides/testing/vitest` - current Vitest setup guidance for Next
- `https://nextjs.org/docs/app/guides/testing/playwright` - current Playwright setup guidance for Next
- `https://supabase.com/docs/guides/database/postgres/row-level-security` - RLS policy behavior and performance guidance
- `https://supabase.com/docs/guides/database/joins-and-nesting` - relation nesting and `!inner` join behavior
- `https://supabase.com/docs/guides/database/postgres/cascade-deletes` - foreign-key delete behavior
- npm registry via `npm view` for `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr`, `supabase`, `zod`, `vitest`, `jsdom`, `@vitejs/plugin-react`, `@testing-library/react`, and `@playwright/test`

### Secondary (MEDIUM confidence)
- `.planning/phases/03-parent-childcare-domain/03-CONTEXT.md` - locked decisions and scope boundaries
- `.planning/ROADMAP.md` - Phase 3 goal and success criteria
- `.planning/STATE.md` - local environment and verification constraints
- `src/app/(member)/account/actions.ts` - existing member action return shape and auth pattern
- `src/app/(admin)/admin/members/page.tsx` - existing admin server-page query pattern
- `src/lib/supabase/server.ts` - `createClient()` vs `createServiceClient()` boundary
- `supabase/migrations/001_initial_schema.sql` through `005_create_member_profile_on_auth_signup.sql` - current migration and RLS conventions

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified current versions and aligned with the repo's installed/runtime stack
- Architecture: HIGH - grounded in locked phase decisions, current code patterns, and official Next/Supabase guidance
- Pitfalls: MEDIUM - mostly derived from official RLS/join behavior plus local architecture inference

**Research date:** 2026-04-06
**Valid until:** 2026-05-06
