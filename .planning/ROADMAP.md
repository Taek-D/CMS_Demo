# Roadmap: CMS Auto-Debit Demo v1.0

**Milestone:** v1.0 Supabase Migration & Flow Verification
**Created:** 2026-04-06

## Proposed Roadmap

**4 phases** | **8 v1 requirements mapped** | **2 portfolio extension phases added**

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Apply migration and validate member flows | Apply Supabase schema and RLS fixes, then verify member signup/account flows on the linked environment. | DB-01, DB-02, MEM-01, MEM-02 | 4 |
| 2 | Validate admin billing flow and close findings | Verify admin-only batch execution, billing results, and document remaining risks. | ADM-01, ADM-02, VER-01, VER-02 | 4 |
| 3 | Add parent-childcare domain foundation | Add child registration plus childcare center/class linking so the product reads like a real nursery operations system. | P3-01, P3-02, P3-03, P3-04 | 4 |
| 4 | Add overdue management and statement export | Add unpaid-member management plus childcare/class monthly statement Excel export for stronger CRM realism. | Portfolio extension | 4 |

## Phase Details

### Phase 1: Apply migration and validate member flows

**Goal:** Apply the remote Supabase migration changes and verify signup, profile creation, and account deletion flows under real permissions.

**Requirements:** DB-01, DB-02, MEM-01, MEM-02

**Success criteria:**
1. Remote Supabase reflects the schema and RLS fixes needed for the current demo.
2. Signup/profile creation is verified end-to-end or the remaining blocker is isolated with evidence.
3. Account delete works under RLS without service-role bypass.
4. DB constraints and trigger behavior are documented with verification evidence.

### Phase 2: Validate admin billing flow and close findings

**Goal:** Verify that admin-only billing execution and results review work end-to-end and document what remains open.

**Requirements:** ADM-01, ADM-02, VER-01, VER-02

**Success criteria:**
1. Non-admin users cannot execute the billing batch API.
2. Admin execution creates billing batch and result records correctly.
3. Admin results UI shows the generated batch outcomes.
4. Remaining risks and follow-up actions are documented clearly.

### Phase 3: Add parent-childcare domain foundation

**Goal:** Extend the member model with children, childcare centers, and classes so parent registration and admin member management reflect the real service domain.

**Requirements:** P3-01, P3-02, P3-03, P3-04 (derived from the Phase 3 success criteria for planning)

**Success criteria:**
1. A signed-in parent can create, edit, and view child records.
2. A child can be linked to a childcare center and class through a searchable selection flow.
3. Admin screens can view parent, child, childcare center, and class relationships together.
4. The new domain model coexists cleanly with the existing member number and billing structures.

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Establish the additive childcare schema contract and Phase 3 validation harness.
- [ ] 03-02-PLAN.md — Build the member child-management page, CRUD actions, and two-step center/class selection flow.
- [ ] 03-03-PLAN.md — Enrich the admin members CRM with parent/child/center/class visibility and filters.
- [ ] 03-04-PLAN.md — Add stable automation hooks and the end-to-end Phase 3 smoke regression.

### Phase 4: Add overdue management and statement export

**Goal:** Turn existing billing results into practical CRM tooling by surfacing unpaid members and exporting class-level monthly statements.

**Requirements:** Portfolio extension

**Success criteria:**
1. Failed billing results appear in a dedicated overdue-management view.
2. Admins can filter overdue rows by batch month, childcare center, and class.
3. Admins can generate and download a monthly Excel statement grouped by childcare center and class.
4. Exported data uses the existing billing results plus the new parent/child/class relationships from Phase 3.

## Next Step

`$gsd-plan-phase 3`

Phase 3 and Phase 4 context are now ready. Plan Phase 3 first, then continue to Phase 4 after the domain foundation is in place.

---
*Last updated: 2026-04-07 after completing Phase 03 Plan 01*
