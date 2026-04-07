# Phase 4: Add overdue management and statement export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 04-overdue-statement-excel
**Areas discussed:** overdue source of truth, admin list behavior, statement export, data integration
**Mode:** Auto-discuss from portfolio-trust implementation plan

---

## Overdue source of truth

| Option | Description | Selected |
|--------|-------------|----------|
| Separate overdue table | Copy failed results into a dedicated unpaid table. | |
| Use failed billing results directly | Treat failed `cms_billing_results` as overdue rows and enrich them with joins. | yes |
| Manual mock data only | Fake overdue data for the portfolio view. | |

**User's choice:** Auto-selected recommended option: use failed billing results directly.
**Notes:** This keeps the portfolio grounded in real billing outputs and avoids needless model duplication.

---

## Admin list behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing results page only | Keep overdue management inside the current results route. | |
| Dedicated overdue route with focused filters | Add a clear unpaid-management page while reusing result query patterns. | yes |
| Export only, no list management | Skip the operational CRM view. | |

**User's choice:** Auto-selected recommended option: dedicated overdue route with focused filters.
**Notes:** This is the strongest signal to a client that the CRM understands collections-style workflows.

---

## Statement export

| Option | Description | Selected |
|--------|-------------|----------|
| CSV export | Faster to implement but weaker as a "replacing Excel" story. | |
| Excel export grouped by childcare center and class | Closest match to current spreadsheet operations and the target client story. | yes |
| PDF statement only | Better presentation but weaker operator utility. | |

**User's choice:** Auto-selected recommended option: Excel export grouped by childcare center and class.
**Notes:** The client brief explicitly mentions statement spreadsheets, so this is the most convincing portfolio output.

---

## Data integration

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Phase 4 independent from Phase 3 | Export only by member and batch. | |
| Depend on Phase 3 child/class relationships | Use the richer domain model to make overdue and statement views operationally meaningful. | yes |
| Add synthetic class labels | Fake class data without modeling the domain properly. | |

**User's choice:** Auto-selected recommended option: depend on Phase 3 child/class relationships.
**Notes:** This preserves the planned stack of "domain realism first, operational realism second."

---

## the agent's Discretion

- Exact workbook layout and styling.
- Whether overdue management includes lightweight action badges or read-only visibility in v1.
- Whether export controls live on the overdue page or on a separate admin export page.

## Deferred Ideas

- Billing retry from the overdue page.
- Scheduled statement generation.
- Manual collections workflow and settlement tracking.
