# Phase 4: Add overdue management and statement export - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn existing billing results into practical admin tooling by exposing unpaid-member management and monthly childcare/class statement export. This phase assumes the parent/child/class relationships from Phase 3 exist and uses them to make billing outputs operationally meaningful.

</domain>

<decisions>
## Implementation Decisions

### Overdue management model
- **D-01:** Treat failed billing results as the source of truth for overdue management rather than creating a separate unpaid table in the first version.
- **D-02:** The overdue list should show member, child, childcare center, class, batch month, amount, and fail reason together so an operator can act without drilling into multiple screens.
- **D-03:** Basic management scope for this phase is visibility and filtering, not full collections workflow. Reattempts or manual resolution actions can be lightweight follow-up work if time remains.

### Admin list behavior
- **D-04:** Provide filters for batch month, childcare center, class, and status with a text search over parent and child names.
- **D-05:** Keep the overdue list in a dedicated admin route rather than overloading the existing results page, because this makes the CRM story more explicit in the portfolio.

### Statement export
- **D-06:** Generate one monthly Excel export scoped by childcare center and class so the output mirrors how an operator would send or reconcile statements in the real service.
- **D-07:** The export should include at minimum member number, parent name, child name, childcare center, class, batch month, amount, billing status, and fail reason.
- **D-08:** Export should be generated on demand from current database state rather than stored as a permanent artifact in the first version.

### Data flow and integration
- **D-09:** Reuse the existing `cms_billing_batches` and `cms_billing_results` records as the billing backbone; Phase 4 adds query joins and export formatting rather than inventing a new billing subsystem.
- **D-10:** Phase 4 depends on Phase 3's parent/child/class model and should be planned after those relationships are defined.

### the agent's Discretion
- Exact Excel library choice and worksheet styling.
- Whether overdue management includes simple badge-based state labels beyond raw billing status.
- Whether statement download lives on the overdue page, a dedicated export page, or both.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and scope
- `.planning/PROJECT.md` - Product framing and why replacing spreadsheet-heavy operations matters for portfolio credibility.
- `.planning/REQUIREMENTS.md` - Existing verified billing/admin capabilities that the new CRM tooling should build on.
- `.planning/ROADMAP.md` - Phase 4 goal, dependency on Phase 3, and success criteria.
- `.planning/STATE.md` - Current billing verification status and roadmap evolution notes.

### Codebase guidance
- `.planning/codebase/ARCHITECTURE.md` - Current batch execution and billing result flow; this phase should extend that backbone rather than replace it.
- `.planning/codebase/STRUCTURE.md` - Existing admin route structure and where new admin/export tooling should live.
- `.planning/codebase/CONVENTIONS.md` - Table-based admin page patterns, feature-local file placement, and server/client boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(admin)/admin/results/page.tsx` and `src/app/(member)/payments/page.tsx` already demonstrate batch/result querying and status display patterns that can be adapted for overdue management.
- `src/components/ui/table.tsx`, `src/components/ui/card.tsx`, and `src/components/ui/badge.tsx` provide enough CRM UI primitives for filtered admin lists.
- `src/lib/supabase/server.ts` already exposes `createServiceClient()` for privileged, cross-member billing queries.

### Established Patterns
- Admin tools are currently server-rendered pages with small client leaves only when interaction is necessary; Phase 4 should follow that pattern.
- Billing work already flows through `cms_billing_batches` and `cms_billing_results`; the new overdue/export behavior should join against those tables rather than duplicate result state.
- Existing member/admin pages rely on straightforward query composition without a separate repository layer, so new billing list/export logic can stay close to the owning route.

### Integration Points
- `src/app/(admin)/admin/results/page.tsx` is the nearest existing admin billing view and can either be extended or used as the reference pattern for a dedicated overdue route.
- `src/app/api/billing/run/route.ts` is the current place where batch result rows are produced; Phase 4 should consume those outputs, not change the batch contract unless necessary.
- The new parent/child/class relations from Phase 3 will need to be joined into overdue queries and export generation.

</code_context>

<specifics>
## Specific Ideas

- The portfolio should visibly answer, "How does an operator find unpaid families and produce a class-level statement without going back to Excel?"
- The strongest demo path is: run billing batch → open overdue list → filter by class → download monthly statement.
- The export does not need heavy styling; credibility comes from realistic columns and scoping, not decorative formatting.

</specifics>

<deferred>
## Deferred Ideas

- Retry billing directly from the overdue list.
- Statement email delivery or scheduled export jobs.
- Rich collections workflow such as call notes, repayment plans, or manual settlement history.

</deferred>

---

*Phase: 04-overdue-statement-excel*
*Context gathered: 2026-04-06*
