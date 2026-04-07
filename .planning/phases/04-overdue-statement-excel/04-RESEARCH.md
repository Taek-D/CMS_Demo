# Phase 04: overdue-statement-excel - Research

**Researched:** 2026-04-08
**Domain:** Admin overdue CRM + on-demand XLSX export in Next.js App Router with Supabase joins
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Treat failed billing results as the source of truth for overdue management rather than creating a separate unpaid table in the first version.
- **D-02:** The overdue list should show member, child, childcare center, class, batch month, amount, and fail reason together so an operator can act without drilling into multiple screens.
- **D-03:** Basic management scope for this phase is visibility and filtering, not full collections workflow. Reattempts or manual resolution actions can be lightweight follow-up work if time remains.
- **D-04:** Provide filters for batch month, childcare center, class, and status with a text search over parent and child names.
- **D-05:** Keep the overdue list in a dedicated admin route rather than overloading the existing results page, because this makes the CRM story more explicit in the portfolio.
- **D-06:** Generate one monthly Excel export scoped by childcare center and class so the output mirrors how an operator would send or reconcile statements in the real service.
- **D-07:** The export should include at minimum member number, parent name, child name, childcare center, class, batch month, amount, billing status, and fail reason.
- **D-08:** Export should be generated on demand from current database state rather than stored as a permanent artifact in the first version.
- **D-09:** Reuse the existing `cms_billing_batches` and `cms_billing_results` records as the billing backbone; Phase 4 adds query joins and export formatting rather than inventing a new billing subsystem.
- **D-10:** Phase 4 depends on Phase 3's parent/child/class model and should be planned after those relationships are defined.

### Claude's Discretion
- Exact Excel library choice and worksheet styling.
- Whether overdue management includes simple badge-based state labels beyond raw billing status.
- Whether statement download lives on the overdue page, a dedicated export page, or both.

### Deferred Ideas (OUT OF SCOPE)
- Retry billing directly from the overdue list.
- Statement email delivery or scheduled export jobs.
- Rich collections workflow such as call notes, repayment plans, or manual settlement history.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- `CLAUDE.md` delegates to `AGENTS.md`; treat `AGENTS.md` as active project instruction.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
- Assume the installed Next.js version has breaking changes relative to older training data.
- Heed current Next.js deprecation notices instead of relying on stale patterns.
- No project-local `.claude/skills/` or `.agents/skills/` directories exist in this repo, so there are no additional repo-specific skills to honor.

## Summary

Phase 04 fits the current repo best as one new server-rendered admin route, `/admin/overdue`, backed directly by failed `cms_billing_results`, plus one sibling download route, `/admin/overdue/export`, that returns an XLSX file on demand. This matches the existing architecture: admin pages stay server-first, privileged cross-member reads use `createServiceClient()`, and binary downloads belong in App Router `route.ts` handlers rather than client-side spreadsheet generation.

The main planning risk is not UI or Excel generation. It is the data model. Billing results are keyed by `member_id`, but childcare relationships are keyed by `cms_children.parent_member_id`. A parent can already have multiple children and multiple classes. That means a "class-level monthly statement" cannot be a truly child-level financial ledger without introducing new billing allocation data. For v1, the safe plan is: keep one logical overdue/export row per billing result, join current child/class relationships for CRM context, and serialize child/class values as filtered comma-joined labels when more than one related record exists.

The phase should stay additive. Do not add a new overdue table. Do not change the billing batch contract. Do not move logic into a generic repository layer. Reuse the current admin filter pattern from `src/app/(admin)/admin/members/page.tsx` and the current service-role billing backbone from `src/app/api/billing/run/route.ts`.

**Primary recommendation:** Build `/admin/overdue` as a server component with URL-driven filters and `/admin/overdue/export` as a `GET` route handler using `exceljs`, while explicitly documenting that exported amounts remain member-level because billing rows are not child-scoped.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.2.2 installed | Admin page + route handler delivery | Already the repo's runtime model; App Router `route.ts` is the native download surface. |
| `@supabase/supabase-js` | 2.101.1 installed | Nested relational reads for overdue rows | Already used throughout the repo; supports embedded joins and joined-field filtering. |
| `exceljs` | 4.4.0 | XLSX workbook generation on the server | Clean workbook/worksheet API, `writeBuffer()`, and enough styling for a practical monthly statement. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.3 | Unit/server-component/workbook tests | Verify filter normalization, Supabase select builders, and XLSX contents fast. |
| Playwright | 1.59.1 | Admin overdue/export smoke verification | Verify the real admin flow and download trigger against the linked environment. |
| Existing shadcn primitives | repo-local | Cards, badges, tables, inputs | Reuse for CRM list UI instead of introducing new component dependencies. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `exceljs` | `xlsx` | `xlsx` works for raw workbook generation, but its current npm release is older and it is a worse fit when you want a straightforward server-side workbook object plus light formatting. |
| `/admin/overdue/export/route.ts` | Server Action download flow | Server Actions are a poorer fit for binary attachment responses and bookmarkable filter URLs. |
| Result-root page with aggregated child/class labels | One row per child join match | Per-child rows look more "statement-like" but can duplicate the same member-level billing amount across siblings/classes. |

**Installation:**
```bash
npm install exceljs
```

**Version verification:** Verified via `npm view ... version time` on 2026-04-08.
- `next` `16.2.2` published `2026-04-01T00:14:36.024Z`
- `@supabase/supabase-js` latest registry version is `2.102.1` published `2026-04-07T11:13:28.339Z`; the repo currently uses `2.101.1`, and this phase does not require an upgrade
- `exceljs` `4.4.0` published `2023-10-19T19:49:55.669Z`
- `vitest` `4.1.3` published `2026-04-07T09:55:51.169Z`
- `@playwright/test` `1.59.1` published `2026-04-01T17:59:00.155Z`

## Architecture Patterns

### Recommended Project Structure
```text
src/
`-- app/
    `-- (admin)/
        `-- admin/
            `-- overdue/
                |-- page.tsx           # Server-rendered overdue CRM list
                |-- page.test.tsx      # Render/filter helper coverage
                |-- data.ts            # Feature-local filter/query/workbook helpers
                `-- export/
                    |-- route.ts       # Auth-checked XLSX download endpoint
                    `-- route.test.ts  # Header + workbook-content verification
tests/
`-- admin-overdue-export.spec.ts       # End-to-end admin smoke for Phase 04
```

### Pattern 1: Server-First Overdue List With URL Filters
**What:** Keep `/admin/overdue` as an async server page that reads `searchParams`, normalizes filters, runs a service-role Supabase query, and renders a table with badges plus export actions.

**When to use:** The admin needs a filterable CRM view, not client-side optimistic editing.

**Example:**
```ts
// Source: https://supabase.com/docs/guides/database/joins-and-nesting
// Mirrors the existing filter pattern in src/app/(admin)/admin/members/page.tsx
const query = supabase
  .from('cms_billing_results')
  .select(`
    id,
    amount,
    status,
    fail_reason,
    processed_at,
    batch:cms_billing_batches!inner (
      id,
      batch_month
    ),
    member:cms_members!inner (
      id,
      member_no,
      name,
      email,
      children:cms_children (
        id,
        name,
        class:cms_childcare_classes (
          id,
          name,
          center:cms_childcare_centers (
            id,
            name
          )
        )
      )
    )
  `)
  .eq('status', 'failed')
  .order('processed_at', { ascending: false });
```

### Pattern 2: Dedicated XLSX Route Handler
**What:** Put the download endpoint under a nested segment such as `/admin/overdue/export` so it can return a binary attachment without conflicting with `page.tsx`.

**When to use:** The UI needs a bookmarkable/filterable download URL or a plain anchor/button that triggers an XLSX download.

**Example:**
```ts
// Source: https://nextjs.org/docs/app/getting-started/route-handlers
// Source: https://github.com/exceljs/exceljs
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Overdue Statement');

  sheet.columns = [
    { header: 'Member No.', key: 'memberNo', width: 18 },
    { header: 'Parent', key: 'parentName', width: 20 },
    { header: 'Child', key: 'childNames', width: 24 },
    { header: 'Center', key: 'centerNames', width: 24 },
    { header: 'Class', key: 'classNames', width: 20 },
    { header: 'Batch Month', key: 'batchMonth', width: 14 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Billing Status', key: 'status', width: 16 },
    { header: 'Fail Reason', key: 'failReason', width: 24 },
  ];

  sheet.addRows(rows);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename=\"overdue-statement-2026-04-sun-class.xlsx\"',
    },
  });
}
```

### Pattern 3: One Billing Row, Aggregated Child/Class Labels
**What:** Normalize nested child/class relations into comma-joined display/export strings instead of duplicating one billing result into multiple child rows.

**When to use:** The underlying money row is member-scoped and there is no child-level allocation table.

**Example:**
```ts
// Source: repo schema evidence from supabase/migrations/001_initial_schema.sql
// and supabase/migrations/006_parent_childcare_domain.sql
function joinUnique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))).join(', ') || '-';
}

function toStatementRow(result: OverdueResultRecord) {
  const children = asArray(result.member.children);

  return {
    memberNo: result.member.member_no,
    parentName: result.member.name,
    childNames: joinUnique(children.map((child) => child.name)),
    centerNames: joinUnique(children.map((child) => child.class?.center?.name)),
    classNames: joinUnique(children.map((child) => child.class?.name)),
    batchMonth: result.batch.batch_month,
    amount: result.amount,
    status: result.status,
    failReason: result.fail_reason ?? '-',
  };
}
```

### Anti-Patterns to Avoid
- **Separate unpaid table:** Violates `D-01` and creates drift from `cms_billing_results`.
- **Client-side Excel generation:** Pushes privileged data and download complexity into the browser for no benefit.
- **One export row per child by default:** Looks simple but misstates money when a parent has multiple related children/classes.
- **Shared repository abstraction for one phase:** Conflicts with the repo's route-local query pattern and adds indirection the codebase does not currently use.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XLSX file generation | Manual XML/ZIP workbook writer | `exceljs` | XLSX packaging, worksheet metadata, and buffer serialization are not worth custom code. |
| Privileged admin gating | New bespoke auth guard | `requireAdmin()` / `getAdminAccess()` | The repo already centralizes admin access decisions there. |
| Joined CRM filtering | Multi-query result stitching in userland | Supabase embedded joins with joined-field filters and `!inner` | Supabase already supports relation-aware select/filter syntax. |
| Download attachment behavior | Ad-hoc client blob plumbing | HTTP response headers in `route.ts` | Route handlers are the native App Router file-delivery mechanism. |

**Key insight:** The hard part in this phase is not generating an `.xlsx`. It is keeping the export truthful despite the member-level billing model. Use libraries for delivery and spend planning effort on row semantics.

## Common Pitfalls

### Pitfall 1: Duplicating Amounts Across Siblings or Classes
**What goes wrong:** The same `cms_billing_results.amount` is exported multiple times because one parent has multiple `cms_children` rows.

**Why it happens:** Billing rows are tied to `member_id`, not `child_id` or `class_id`.

**How to avoid:** Keep one logical export/list row per billing result and aggregate related child/class names into display cells. If true per-child allocation is required later, it needs schema changes, not just query work.

**Warning signs:** The same member number appears multiple times in the same month with identical amount and fail reason after adding class joins.

### Pitfall 2: Filters That Do Not Actually Narrow the Parent Set
**What goes wrong:** Filtering by center/class still returns unrelated overdue rows with empty related arrays.

**Why it happens:** Supabase embedded relations are left joins by default.

**How to avoid:** Use `!inner` on the embedded relation whenever a joined-table filter is active, exactly like the current admin members page pattern.

**Warning signs:** Rows remain visible when the selected class clearly has no matching children.

### Pitfall 3: Export Truncation on Larger Datasets
**What goes wrong:** The XLSX includes only the first page of results.

**Why it happens:** Supabase recommends paginating larger reads and defaults can cap returned rows in some hosted setups; export code that never uses `.range()` is brittle once data grows.

**How to avoid:** Add a paged fetch helper for export generation if row count can exceed the first page, and keep the query ordered before paginating.

**Warning signs:** UI count and export count diverge, or a later seeded dataset silently exports fewer rows than expected.

### Pitfall 4: Route/Page Collision
**What goes wrong:** Adding `route.ts` beside `page.tsx` at the same segment causes a routing conflict.

**Why it happens:** In App Router, a segment cannot own both `page.tsx` and `route.ts`.

**How to avoid:** Place the download handler in a nested segment such as `overdue/export/route.ts`.

**Warning signs:** Next build complains about conflicting routing files.

### Pitfall 5: Overdue View and Statement Export Drift
**What goes wrong:** The table and export apply different filters or transform children/classes differently.

**Why it happens:** Filter normalization and row decoration live in separate files with duplicated logic.

**How to avoid:** Put filter parsing, select-builder logic, row decoration, and workbook-row mapping in one feature-local helper module shared by both the page and the route.

**Warning signs:** Exported rows do not match the rows currently visible after applying filters in the UI.

## Code Examples

Verified patterns from official sources:

### Joined Filter With `!inner`
```ts
// Source: https://supabase.com/docs/guides/database/joins-and-nesting
const select = `
  id,
  name,
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
`;
```

### XLSX Buffer Response
```ts
// Source: https://github.com/exceljs/exceljs
// Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
const buffer = await workbook.xlsx.writeBuffer();

return new Response(buffer, {
  headers: {
    'Content-Type':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition':
      `attachment; filename=\"${fileName}.xlsx\"`,
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/api/*` downloads | App Router `route.ts` handlers | Next.js App Router era | Use nested route handlers for binary export instead of legacy API Routes. |
| Manual multi-query join stitching | Supabase embedded joins with joined-field filters and `!inner` | Current Supabase JS relational query model | Keep relation filters declarative and close to the route. |

**Deprecated/outdated:**
- Client-only spreadsheet export for privileged admin data: outdated for this repo because it bypasses the server-first admin pattern and complicates auth.

## Open Questions

1. **What does "class-level monthly statement" mean when billing is member-scoped?**
   - What we know: `cms_billing_results` belongs to a member, while Phase 3 explicitly supports multiple children per parent.
   - What's unclear: Whether the portfolio story expects true per-child finance rows or just a class-scoped CRM statement.
   - Recommendation: Lock v1 to one row per billing result with aggregated child/class labels, and document the limitation explicitly in the plan.

2. **Should the export include all statuses or only overdue rows?**
   - What we know: The overdue view is failed-only, but `D-07` requires `billing status` and `fail reason`, which implies the export may span more than failed rows.
   - What's unclear: Whether the monthly statement is meant as a full class reconciliation sheet or an overdue follow-up sheet.
   - Recommendation: Make the export default to all results for the selected month/center/class, with an optional `status` filter that can be set to `failed` from the overdue page.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next runtime, route handler tests | yes | 22.17.1 | none |
| npm / npx | Install `exceljs`, run tests, optional Supabase CLI via package | yes | 10.9.2 | none |
| Vitest | Page/helper/workbook tests | yes | 4.1.3 | none |
| Playwright + local browsers | Admin overdue/export smoke test | yes | 1.59.1 | none |
| Supabase env vars in `.env.local` | Service-role overdue query + admin auth gating | yes | keys present | none |
| Global `supabase` CLI | Optional linked-environment inspection | no | none | `npx supabase` |

**Missing dependencies with no fallback:**
- None identified for this phase.

**Missing dependencies with fallback:**
- Global `supabase` CLI is not installed, but the repo can invoke `npx supabase` if remote inspection is needed during execution.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 + Playwright 1.59.1 |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" "src/app/(admin)/admin/overdue/export/route.test.ts" -x` |
| Full suite command | `npm run test:unit && npm run test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-04-01 | Failed billing results appear in a dedicated overdue-management view | unit/server render | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" -x` | No - Wave 0 |
| SC-04-02 | Admins can filter overdue rows by batch month, childcare center, and class | unit/helper + server render | `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" -x` | No - Wave 0 |
| SC-04-03 | Admins can generate and download a monthly Excel statement grouped by childcare center and class | route/workbook integration | `npx vitest run "src/app/(admin)/admin/overdue/export/route.test.ts" -x` | No - Wave 0 |
| SC-04-04 | Exported data uses existing billing results plus Phase 3 relations | end-to-end smoke | `npx playwright test tests/admin-overdue-export.spec.ts --project=chromium` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run "src/app/(admin)/admin/overdue/page.test.tsx" "src/app/(admin)/admin/overdue/export/route.test.ts" -x`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** `npm run test:unit && npx playwright test tests/admin-overdue-export.spec.ts --project=chromium`

### Wave 0 Gaps
- [ ] `src/app/(admin)/admin/overdue/page.test.tsx` - covers SC-04-01 and SC-04-02
- [ ] `src/app/(admin)/admin/overdue/export/route.test.ts` - covers SC-04-03 workbook headers, file response headers, and filter scoping
- [ ] `tests/admin-overdue-export.spec.ts` - covers SC-04-04 with seeded failed billing data and real admin navigation
- [ ] Shared Phase 04 seed helper extraction from `tests/member-billing-smoke.spec.ts` if the execution plan wants to avoid copy-pasting admin/member seed code

## Sources

### Primary (HIGH confidence)
- Official Next.js App Router route-handler docs: https://nextjs.org/docs/app/getting-started/route-handlers
- Official Supabase join/nesting docs: https://supabase.com/docs/guides/database/joins-and-nesting
- Official Supabase select reference: https://supabase.com/docs/reference/javascript/select
- Official Supabase range reference: https://supabase.com/docs/reference/javascript/range
- ExcelJS official repository README: https://github.com/exceljs/exceljs
- MDN `Content-Disposition` header reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
- Repo-local architecture evidence: `src/app/(admin)/admin/members/page.tsx`, `src/app/api/billing/run/route.ts`, `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/006_parent_childcare_domain.sql`

### Secondary (MEDIUM confidence)
- npm registry metadata verified via `npm view next version time`, `npm view @supabase/supabase-js version time`, `npm view exceljs version time`, `npm view vitest version time`, and `npm view @playwright/test version time`
- `xlsx` registry metadata verified via `npm view xlsx version time` for alternative comparison

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - mostly existing repo stack plus official docs and npm registry verification
- Architecture: MEDIUM - route/page/export shape is clear, but class-level statement semantics are constrained by the current member-level billing model
- Pitfalls: HIGH - directly evidenced by the repo schema and official Supabase/Next behavior

**Research date:** 2026-04-08
**Valid until:** 2026-04-15
