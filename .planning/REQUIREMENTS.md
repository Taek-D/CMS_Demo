# Requirements: CMS Auto-Debit Demo

**Defined:** 2026-04-06
**Core Value:** Members and admins should both be able to exercise the CMS auto-debit flow closely enough to validate real behavior, not just happy-path mocks.

## v1 Requirements

### Database Integrity

- [ ] **DB-01**: Apply `003_fix_rls_and_constraints.sql` to the linked remote Supabase database without errors.
- [ ] **DB-02**: Confirm that member profile insert, bank account delete, and monthly billing batch uniqueness all work at the database layer.

### Member Flows

- [ ] **MEM-01**: A new member can complete signup from the UI path and create a matching `cms_members` profile row.
- [ ] **MEM-02**: A signed-in member can delete their registered bank account from the app flow.

### Admin Flows

- [ ] **ADM-01**: Only an admin can access the billing run API and admin pages.
- [ ] **ADM-02**: An admin can execute a billing batch and confirm the generated results in the admin UI.

### Verification

- [ ] **VER-01**: Signup, account delete, and admin billing execution evidence is documented.
- [ ] **VER-02**: Remaining risks and the next follow-up action are documented clearly.

## v2 Requirements

### Product Expansion

- **EXP-01**: Add richer email/password recovery and account management flows.
- **EXP-02**: Make webhook and billing execution behavior closer to a production-like CMS integration.

## Phase 3 Derived Requirements

### Parent-Childcare Domain

- [ ] **P3-01**: A signed-in parent can create, edit, and view child records.
- [ ] **P3-02**: A child can be linked to a childcare center and class through a searchable selection flow.
- [x] **P3-03**: Admin screens can view parent, child, childcare center, and class relationships together.
- [x] **P3-04**: The childcare domain model stays additive and regression-safe alongside the existing member number and billing structures.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full UI redesign | This milestone is focused on flow correctness and verification. |
| New payment or invoicing features | Existing auto-debit flow validation is the current priority. |
| Deep mobile responsiveness work | This milestone is scoped to end-to-end flow verification. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| MEM-01 | Phase 1 | Blocked |
| MEM-02 | Phase 1 | Complete |
| ADM-01 | Phase 2 | Complete |
| ADM-02 | Phase 2 | Complete |
| VER-01 | Phase 2 | Complete |
| VER-02 | Phase 2 | Complete |
| P3-01 | Phase 3 | Planned |
| P3-02 | Phase 3 | Planned |
| P3-03 | Phase 3 | Complete |
| P3-04 | Phase 3 | Complete |

## Latest Verification Notes

- `DB-02` is complete because user-scoped profile insert, user-scoped bank account delete, and duplicate monthly batch rejection were all re-verified on the linked remote data path.
- `MEM-01` remains blocked by Supabase Auth email send throttling (`over_email_send_rate_limit`), not by the current application code path. Signup profile creation now lives in `005_create_member_profile_on_auth_signup.sql`.
- `VER-02` is complete because the remaining risk and next action are now explicit: wait for Auth email cooldown, then re-run one real UI signup to close `MEM-01`.
- `P3-03` is complete because `03-03` now renders parent, child, childcare center, and class relationships together on `/admin/members` with targeted filter and rendering test coverage.
- `P3-04` is complete because `03-01` added the Phase 3 test harness plus an additive childcare migration and synced database types without changing `generate_member_no` or the billing tables.

**Coverage:**
- v1 requirements: 8 total
- Phase 3 derived requirements: 4 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-08 after completing Phase 03 Plan 03 admin CRM work*
